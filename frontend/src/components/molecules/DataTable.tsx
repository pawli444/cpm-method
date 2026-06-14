import type { ReactNode } from 'react'

interface DataTableProps {
  headers: string[]
  rows: ReactNode[][]
}

const DataTable = ({ headers, rows }: DataTableProps) => {
  return (
    <div className="table-wrap" role="region" aria-label="Tabela wynikow CPM">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
