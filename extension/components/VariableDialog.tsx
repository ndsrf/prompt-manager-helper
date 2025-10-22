import { useState } from "react"
import type { Variable } from "~/lib/types"
import { X } from "lucide-react"
import { cn } from "~/lib/utils"

interface VariableDialogProps {
  variables: Variable[]
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
}

export function VariableDialog({ variables, onSubmit, onCancel }: VariableDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    variables.forEach((v) => {
      initial[v.name] = v.default || ''
    })
    return initial
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Fill in Variables</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {variables.map((variable) => (
              <div key={variable.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {variable.name}
                </label>

                {variable.type === 'select' && variable.options ? (
                  <select
                    value={values[variable.name]}
                    onChange={(e) =>
                      setValues({ ...values, [variable.name]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    {variable.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : variable.type === 'number' ? (
                  <input
                    type="number"
                    value={values[variable.name]}
                    onChange={(e) =>
                      setValues({ ...values, [variable.name]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={variable.default || `Enter ${variable.name}...`}
                  />
                ) : (
                  <textarea
                    value={values[variable.name]}
                    onChange={(e) =>
                      setValues({ ...values, [variable.name]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[60px] max-h-[200px]"
                    placeholder={variable.default || `Enter ${variable.name}...`}
                    rows={3}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Utility function to substitute variables in content
export function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content
  Object.entries(values).forEach(([name, value]) => {
    const regex = new RegExp(`{{\\s*${name}\\s*}}`, 'g')
    result = result.replace(regex, value)
  })
  return result
}
