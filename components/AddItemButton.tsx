'use client'

type AddItemButtonProps = {
  onClick: () => void
}

export default function AddItemButton({ onClick }: AddItemButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      + Add Item
    </button>
  )
}

