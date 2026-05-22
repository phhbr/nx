import { Cell } from "./cell";

export interface Row {
    id: string | number;
    cells: Cell[];
    selected?: boolean;
}