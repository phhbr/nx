import { CellType } from "./cell.type";
import { Status } from "./status";

export interface Cell {
    type: CellType;
    value: string | Status;
    displayValue: string;
    columnId: string | number;
}