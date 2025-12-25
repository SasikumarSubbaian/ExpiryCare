import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// API route to download documents securely
// Downloads files directly from Supabase storage and streams them to the user
// This ensures users can only download their own documents and hides Supabase URLs
export async function GET(
  request: Request,
  { params }: { params: { path: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decode the path (it's URL encoded)
    // The path format from document_url is: user_id/filename
    // But it might come as full URL or just path
    let filePath = decodeURIComponent(params.path)
    
    // If it's a full URL, extract just the path part
    // Handle various Supabase storage URL formats
    if (filePath.includes('/storage/v1/object/public/documents/')) {
      filePath = filePath.split('/storage/v1/object/public/documents/')[1]
    } else if (filePath.includes('/storage/v1/object/sign/documents/')) {
      filePath = filePath.split('/storage/v1/object/sign/documents/')[1]
    } else if (filePath.includes('/storage/v1/object/authenticated/documents/')) {
      filePath = filePath.split('/storage/v1/object/authenticated/documents/')[1]
    }
    
    // Remove any query parameters (like ?token=...)
    if (filePath.includes('?')) {
      filePath = filePath.split('?')[0]
    }
    
    // Extract user_id from path (format: user_id/filename)
    const pathParts = filePath.split('/')
    if (pathParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid file path format' },
        { status: 400 }
      )
    }

    const fileUserId = pathParts[0]
    const fileName = pathParts.slice(1).join('/')
    
    // Verify user owns this file
    if (fileUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own files' },
        { status: 403 }
      )
    }

    // Note: We'll download directly, so no need to check file existence separately

    // Download the file directly from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(filePath)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file', details: downloadError.message },
        { status: 500 }
      )
    }

    if (!fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract filename from path
    const filename = pathParts[pathParts.length - 1]
    
    // Detect content type from file extension
    const getContentType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase()
      const contentTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      return contentTypes[ext || ''] || 'application/octet-stream'
    }

    // Return file with proper headers to force download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': getContentType(filename),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error: any) {
    console.error('Error in document download route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

