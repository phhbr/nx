import { Component, h, Prop } from "@stencil/core";
import { Cell, Row } from "../../interfaces/components/table";

@Component({
    tag: "dpl-table",
    styleUrl: "table.css",
    shadow: true,
})
export class Table {
    @Prop() rows: Row[] = [];
    @Prop() columns: string[] = [];

    renderCell(cell?: Cell) {
        if (!cell) return null;
        switch (cell.type) {
            case "text":
                return cell.value;
            case "date":
                return 'Not implemented yet';
            case "number":
                return cell.value.toLocaleString();
            case "icon":
                return <i class={`${cell.value}`}></i>;
            case "select":
                return (
                    'Not implemented yet'
                );
            case "status":
                return <span class={`status ${cell.value}`}>{cell.value}</span>;
            case "checkbox":
                return <input type="checkbox" checked={Boolean(cell.value)} aria-label="Checkbox" />;
            default:
                return cell.value;
        }

    }

    render() {
        const { rows, columns } = this;
        return (
            <table>
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr>
                            {columns.map(column => (
                                <td>{this.renderCell(row.cells.find(cell => cell.columnId === column))}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

