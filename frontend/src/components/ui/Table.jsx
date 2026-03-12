import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'
import Spinner from './Spinner'

const Table = ({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface">
          <thead className="bg-surface/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-surface">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-text-secondary">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-surface/50' : ''}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface">
          <div className="text-sm text-text-secondary">
            Showing {pagination.page * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === 0}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table