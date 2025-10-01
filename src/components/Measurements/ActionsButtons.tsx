import type Shape from "@giro3d/giro3d/entities/Shape";

interface ActionButtonsProps {
    shapes: Shape[];
    isEditMode: boolean;
    isDrawing: boolean;
    onStartEdit: () => void;
    onExitEdit: () => void;
    onExport: () => void;
    onRemoveAll: () => void;
}


const ActionButtons = ({
    shapes,
    isEditMode,
    isDrawing,
    onStartEdit,
    onExitEdit,
    onExport,
    onRemoveAll
}: ActionButtonsProps) => {
    return (
        <div>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Acciones</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button
                    onClick={onStartEdit}
                    disabled={shapes.length === 0 || isEditMode || isDrawing}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    {isEditMode ? 'Editando...' : 'Editar Forma'}
                </button>

                {isEditMode && (
                    <button
                        onClick={onExitEdit}
                        style={{ padding: '8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white' }}
                    >
                        Terminar Edición
                    </button>
                )}

                <button
                    onClick={onExport}
                    disabled={shapes.length === 0}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    Exportar GeoJSON
                </button>

                <button
                    onClick={onRemoveAll}
                    disabled={shapes.length === 0 || isEditMode}
                    style={{ padding: '8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white' }}
                >
                    Eliminar Todo
                </button>
            </div>
        </div>
    );
};

export default ActionButtons;