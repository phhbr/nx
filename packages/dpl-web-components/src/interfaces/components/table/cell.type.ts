/**
 * Defines the type of a cell in the table component. This can be used to determine how to render the cell content and what kind of interactions are possible with it.
 * 
 * @deprecated The CellType "icon" is deprecated and should not be used in new implementations. It may be removed in future versions. Please use the "status" type instead for representing status indicators.
 */
export type CellType = "text" | "date" | "number" | "icon" | "select" | "status" | "checkbox";