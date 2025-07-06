import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import ProjectContext from '@/context/ProjectContext';
import EditProjectModal from '@/components/Projects/EditProjectModal';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import { DataTable } from '@/components/ui/tables/data-table';
import { DataTableToolbar } from '@/components/ui/tables/data-table-toolbar';
import { columns as projectTableColumns } from '@/components/Projects/Table/columns';
import AddProjectModal from '@/components/Projects/AddProjectModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ProjectListPage = () => {
  const { projects, fetchProjects, deleteProject, isLoading, error } =
    useContext(ProjectContext);
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // State for Tanstack Table
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = useCallback(
    (projectId) => {
      navigate(`/projects/${projectId}`);
    },
    [navigate]
  );

  const handleEditClick = useCallback((project) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
  }, []);

  const handleDeleteClick = useCallback((project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
    } catch (err) {
      console.error('Delete project error:', err);
    } finally {
      setIsDeleting(false);
      handleCloseDeleteModal();
    }
  }, [projectToDelete, deleteProject, handleCloseDeleteModal]);

  const table = useReactTable({
    data: projects,
    columns: projectTableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    meta: {
      onEdit: handleEditClick,
      onDelete: handleDeleteClick,
      onRowClick: (row, event) => {
        if (!event.target.closest('.project-actions-cell')) {
          handleSelectProject(row.original.id);
        }
      },
    },

    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col flex-1 h-full p-4 md:p-8 gap-8">
      {isLoading ? <p>Loading projects...</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      {!isLoading &&
        !error &&
        (projects.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-end mb-2 gap-2">
              <DataTableToolbar
                table={table}
                onAdd={() => setIsAddProjectModalOpen(true)}
                addButtonText="Add Project"
                filterColumnId="name"
                filterColumnPlaceholder="Search by project title..."
              />
            </div>
            <DataTable table={table} columns={projectTableColumns} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                You have no projects
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get started by creating a new project.
              </p>
              <Button onClick={() => setIsAddProjectModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </div>
          </div>
        ))}

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
      />
      <EditProjectModal
        project={projectToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${projectToDelete?.name}"? This will also delete all associated tasks.`}
        isLoading={isDeleting}
        confirmText="Delete"
        loadingText="Deleting..."
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default ProjectListPage;
