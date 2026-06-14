import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (info: {
    getValue: () => unknown;
    row: { original: T };
  }) => React.ReactNode;
  enableSorting?: boolean;
  sortingFn?: (a: T, b: T) => number;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  /** Controlled sort — column id */
  sortColumn?: string;
  /** Controlled sort — direction */
  sortDirection?: "asc" | "desc";
  /** Called when user clicks a sortable column header */
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  onRowKeyDown?: (row: T, event: React.KeyboardEvent) => void;
  onRowMouseEnter?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
  enablePagination?: boolean;
  enableSearch?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys,
  pageSize = 10,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  onRowKeyDown,
  onRowMouseEnter,
  rowClassName = "",
  enablePagination = true,
  enableSearch = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.enableSorting || !onSort) return;
    const nextDir =
      sortColumn === col.id && sortDirection === "asc" ? "desc" : "asc";
    onSort(col.id, nextDir);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm || !enableSearch) return data;
    return data.filter((row) => {
      if (searchKeys) {
        return searchKeys.some((key) =>
          row[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      return Object.values(row).some((v) =>
        v?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      );
    });
  }, [data, searchTerm, searchKeys, enableSearch]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = enablePagination
    ? filteredData.slice(startIndex, endIndex)
    : filteredData;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (column.accessorFn) return column.accessorFn(row);
    if (column.accessorKey) return row[column.accessorKey];
    return null;
  };

  const renderCell = (row: T, column: ColumnDef<T>) => {
    const value = getCellValue(row, column);
    if (column.cell)
      return column.cell({ getValue: () => value, row: { original: row } });
    return value as React.ReactNode;
  };

  const handleRowKeyDown = (row: T, event: React.KeyboardEvent) => {
    if (onRowKeyDown) {
      onRowKeyDown(row, event);
    } else if (onRowClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onRowClick(row);
    }
  };

  const getRowClassName = (row: T): string => {
    if (typeof rowClassName === "function") return rowClassName(row);
    return rowClassName;
  };

  const SortIcon = ({ colId }: { colId: string }) => {
    if (sortColumn !== colId)
      return (
        <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/50" />
      );
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-3">
      {enableSearch && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          {searchTerm && (
            <span className="text-sm text-muted-foreground">
              {filteredData.length} of {data.length}
            </span>
          )}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  style={column.width ? { width: column.width } : undefined}
                  className={
                    column.enableSorting && onSort
                      ? "cursor-pointer select-none"
                      : ""
                  }
                  onClick={() => handleSort(column)}>
                  {column.enableSorting && onSort ? (
                    <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {column.header}
                      <SortIcon colId={column.id} />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {column.header}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No results found." : "No data available."}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row, index) => (
                <TableRow
                  key={index}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => handleRowKeyDown(row, e)}
                  onMouseEnter={() => onRowMouseEnter?.(row)}
                  className={`border-b last:border-0 transition-colors ${getRowClassName(row)}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className="py-3">
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">
            {startIndex + 1}–{Math.min(endIndex, filteredData.length)} of{" "}
            {filteredData.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3">
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground px-1">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
