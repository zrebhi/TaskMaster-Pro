# **Feature Guide: Tanstack Data Tables**

_This document outlines the standard approach for creating and managing data tables within the project._

### **1. Introduction**

This guide documents our application's implementation of data tables, which is built upon a set of reusable React components powered by the headless **Tanstack Table (v8)** library. This provides a flexible and consistent foundation for features like sorting, column visibility, and row-level actions.

Our implementation is designed around a core architectural principle: a **separation of concerns** between generic UI and data-specific configuration.

-   **Generic Table UI:** All reusable, data-agnostic table components are located in `frontend/src/components/ui/tables/`. These components (`DataTable`, `DataTableToolbar`, etc.) provide the table's structure and functionality but have no knowledge of the data they are displaying (e.g., Projects vs. Tasks).

-   **Data-Specific Configuration:** The "schema" for a specific table—defining its columns, how cells are rendered, and available row actions—is configured in a dedicated `columns.jsx` file. This file is co-located with the feature it belongs to (e.g., `frontend/src/components/Tasks/Table/columns.jsx`).

This approach ensures that our core table components are highly reusable, while feature-specific table logic remains clean, organized, and easy to maintain. This guide will walk you through the architecture, key patterns, and the step-by-step process for adding new tables to the application.

---

### **2. Table of Contents**

- [**Feature Guide: Tanstack Data Tables**](#feature-guide-tanstack-data-tables)
    - [**1. Introduction**](#1-introduction)
    - [**2. Table of Contents**](#2-table-of-contents)
    - [**1. Architecture \& File Structure**](#1-architecture--file-structure)
      - [**A. Generic UI Components**](#a-generic-ui-components)
      - [**B. Feature-Specific Configuration**](#b-feature-specific-configuration)
      - [**C. Consumer Page Component**](#c-consumer-page-component)
    - [**2. Core Concepts \& Patterns**](#2-core-concepts--patterns)
      - [**A. The `columns` Definition**](#a-the-columns-definition)
      - [**B. Passing Actions with the `meta` Prop**](#b-passing-actions-with-the-meta-prop)
      - [**C. Data Flow \& State Management**](#c-data-flow--state-management)
    - [**3. How-To Guide: Implementing a New Table**](#3-how-to-guide-implementing-a-new-table)
      - [**Step 1: Create the `columns.jsx` File**](#step-1-create-the-columnsjsx-file)
      - [**Step 2: Create the Consumer Page Component**](#step-2-create-the-consumer-page-component)
      - [**Step 3: Add Modals and Context (If Needed)**](#step-3-add-modals-and-context-if-needed)
      - [**Step 4: Review and Verify**](#step-4-review-and-verify)
    - [**4. Component API Reference**](#4-component-api-reference)
      - [**`<DataTable />`**](#datatable-)
      - [**`<DataTableToolbar />`**](#datatabletoolbar-)
      - [**`<DataTableColumnHeader />`**](#datatablecolumnheader-)
      - [**`<DataTableRowActions />`**](#datatablerowactions-)

---

Excellent. Here is the content for the **"Architecture & File Structure"** section of your guide.

---

### **1. Architecture & File Structure**

Our Tanstack Table implementation is organized into three distinct layers. Understanding this structure is key to using the existing tables and creating new ones efficiently.

```
frontend/src/
├── components/
│   ├── Tasks/
│   │   └── Table/
│   │       └── columns.jsx       # (2) Feature-Specific Configuration
│   └── ui/
│       ├── tables/               # (1) Generic UI Components
│       │   ├── data-table.jsx
│       │   ├── data-table-toolbar.jsx
│       │   ├── data-table-column-toggle.jsx
│       │   ├── data-table-column-header.jsx
│       │   └── data-table-row-actions.jsx
│       └── table.jsx             # Base Shadcn/UI table components
└── pages/
    └── ProjectTasksPage.jsx      # (3) Consumer Page Component
```

---

#### **A. Generic UI Components**

This layer contains the reusable, **data-agnostic** building blocks for any table in the application. These components live in `frontend/src/components/ui/tables/`. They define the table's behavior and appearance but know nothing about the specific data they will display.

-   **`data-table.jsx`**:
    This is the main wrapper component. It initializes Tanstack Table using the `useReactTable` hook and is responsible for rendering the `<Table>`, `<TableHeader>`, and `<TableBody>`. It accepts `columns`, `data`, and `meta` as its primary props.

-   **`data-table-toolbar.jsx`**:
    This component provides a toolbar that sits above the data table. It is designed to hold controls like filtering inputs (if added later) and the column visibility toggle.

-   **`data-table-column-toggle.jsx`**:
    Renders the "View" dropdown menu, allowing users to show or hide specific columns in the table. It gets the column state directly from the table instance passed to its parent, `DataTableToolbar`.

-   **`data-table-column-header.jsx`**:
    A specialized component used inside the `header` definition of a column. It renders the column title and provides the UI (arrows) and logic for sorting.

-   **`data-table-row-actions.jsx`**:
    Renders the "..." dropdown menu at the end of each row. It provides the UI for actions like "Edit" or "Delete". The actual functions to be executed are passed down from the page component via the `meta` prop.

#### **B. Feature-Specific Configuration**

This is the bridge between our generic table components and our specific application data. For each type of data we want to display in a table (e.g., Tasks, Projects), we create a **`columns.jsx`** file.

-   **Location:** `frontend/src/components/[Feature]/Table/columns.jsx` (e.g., `frontend/src/components/Tasks/Table/columns.jsx`).
-   **Purpose:** This file exports a `columns` array that serves as the **blueprint** for the table. It defines:
    -   Which data fields to display (`accessorKey`).
    -   The header text for each column (`header`).
    -   How to render the content of each cell (`cell`), allowing for custom JSX like badges or formatted dates.
    -   Which columns are sortable, filterable, or hideable.

#### **C. Consumer Page Component**

This is the top-level component where everything is assembled. This is typically a page component, like `frontend/src/pages/ProjectTasksPage.jsx`.

The page component is responsible for:
-   **Fetching and managing data** (e.g., from a React Context or an API call).
-   **Managing page-level state**, such as the visibility of modals (`isEditTaskModalOpen`) or the state of the table's column visibility (`columnVisibility`).
-   **Defining action handlers** (`handleEditTask`, `handleDeleteTask`) that contain the business logic for what happens when a user interacts with a table row.
-   **Passing all necessary props** (`data`, `columns`, `meta`, state variables, and state setters) down to the `<DataTable>` and `<DataTableToolbar>` components.


### **2. Core Concepts & Patterns**

Our table implementation relies on a few key concepts from Tanstack Table and React. Understanding these patterns is essential for customizing existing tables or building new ones.

#### **A. The `columns` Definition**

The `columns` array is the heart of any table's configuration. It's an array of objects where each object defines a single column. Let's break down a column definition from `frontend/src/components/Tasks/Table/columns.jsx`:

```javascript
// frontend/src/components/Tasks/Table/columns.jsx

export const columns = [
  // ...
  {
    accessorKey: 'status', // 1. Links this column to the 'status' property in our data object
    header: ({ column }) => ( // 2. Defines the header's content
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { // 3. Custom metadata for our components
      headerTitle: "Status",
    },
    cell: ({ row }) => { // 4. Defines the cell's content for each row
      const status = statuses.find(
        (s) => s.value.toLowerCase() === (row.getValue('status')?.toLowerCase() || '')
      );
      // ... renders a custom component with an icon and label
      return (
        <div className="flex w-[100px] items-center gap-2">
          {status.icon && <status.icon className="text-muted-foreground h-4 w-4" />}
          <span className="capitalize">{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => { // 5. Custom filtering logic
      return value.includes(row.getValue(id));
    },
    enableHiding: false, // 6. Prevents this column from being hidden by the user
  },
  // ... more column definitions
];
```

1.  **`accessorKey`**: A string that matches a key in your data objects (e.g., `data: [{ status: 'to do' }]`). This tells Tanstack Table which piece of data to display in this column.
2.  **`header`**: A function that returns the JSX for the column's header. We pass the `column` instance to our reusable `<DataTableColumnHeader />` component to automatically enable sorting UI and logic.
3.  **`meta`**: An optional object where you can place custom information. Here, we use `meta.headerTitle` to provide a simple string for the column toggle dropdown, which is cleaner than trying to parse the JSX from the `header` function.
4.  **`cell`**: A function that returns the JSX for a table cell in each row. It receives the `row` object, which allows you to get the specific value for that cell using `row.getValue('accessorKey')`. This is where you format dates, render badges, or create any other custom display logic.
5.  **`filterFn`**: A function that defines how filtering works for this column. This example allows for filtering by an array of values (e.g., from a multi-select dropdown).
6.  **`enableHiding`**: A boolean that determines if the user can hide this column via the "View" menu. Essential columns like "Title" or "Actions" should have this set to `false`.

#### **B. Passing Actions with the `meta` Prop**

A common challenge is passing page-level functions (like `handleEdit` or `handleDelete`) into a deeply nested component like `<DataTableRowActions />` without excessive prop-drilling.

We solve this using Tanstack Table's `meta` option. This is a special property that makes data and functions available to all parts of the table instance.

Here is the flow:

1.  **Define Handlers on the Page**: In the consumer page component (`ProjectTasksPage.jsx`), the functions that open modals or trigger API calls are defined.

    ```javascript
    // frontend/src/pages/ProjectTasksPage.jsx
    const handleEditTask = useCallback((task) => {
      setTaskToEdit(task);
      setIsEditTaskModalOpen(true);
    }, []);

    const handleDeleteTask = useCallback((task) => {
      setTaskToDelete(task);
      setIsDeleteTaskModalOpen(true);
    }, []);
    ```

2.  **Pass Handlers via `meta` Prop**: These handlers are passed to the `<DataTable>` component inside the `meta` prop.

    ```javascript
    // frontend/src/pages/ProjectTasksPage.jsx
    <DataTable
      columns={taskTableColumns}
      data={transformedTasks}
      meta={{
        onEdit: handleEditTask,
        onDelete: handleDeleteTask,
      }}
      // ... other props
    />
    ```

3.  **Access `meta` in the `columns` Definition**: In `columns.jsx`, the "actions" column can now access these functions through `table.options.meta`.

    ```javascript
    // frontend/src/components/Tasks/Table/columns.jsx
    {
      id: 'actions',
      cell: ({ row, table }) => {
        const meta = table.options.meta; // Access the meta object
        return (
          <DataTableRowActions
            row={row}
            onEdit={meta?.onEdit}     // Pass the functions down
            onDelete={meta?.onDelete} // as props
          />
        );
      },
    }
    ```

This pattern keeps the intermediate components clean and ensures the page remains the single source of truth for business logic.

#### **C. Data Flow & State Management**

Effective state management is crucial for the table to function correctly. The page component acts as the central controller, managing all state and passing it down as props. This is known as **"lifting state up."**

-   **Data State (`tasks`, `projects`)**:
    The actual data for the table is fetched and managed by a global React Context (`TaskContext` or `ProjectContext`). The page component triggers the fetch and receives the data. It may then transform this data for display purposes, often wrapped in a `useMemo` hook for performance.

    ```javascript
    // frontend/src/pages/ProjectTasksPage.jsx
    const { tasks, fetchTasks } = useContext(TaskContext);

    useEffect(() => {
      if (projectId) {
        fetchTasks(projectId);
      }
    }, [projectId, fetchTasks]);

    const transformedTasks = useMemo(() => {
      return tasks.map((task) => ({
        ...task,
        status: task.is_completed ? 'done' : 'to do',
        // ... other transformations
      }));
    }, [tasks]);
    ```

-   **UI State (`columnVisibility`)**:
    State related to the table's UI, such as which columns are visible, is managed directly in the page component using `useState`.

    ```javascript
    // frontend/src/pages/ProjectTasksPage.jsx
    const [columnVisibility, setColumnVisibility] = useState({});

    // ...

    <DataTableToolbar
      table={reactTableInstance}
      columnVisibility={columnVisibility}
    />
    <DataTable
      // ...
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
    />
    ```

    By lifting this state to the page, we can share it between sibling components:
    -   `<DataTable>` uses it to show/hide columns.
    -   `onColumnVisibilityChange` allows the table to update the state when a user interacts with the column hide menu.
    -   `<DataTableToolbar>` uses it to correctly display the checked/unchecked state of the column toggle checkboxes.

### **3. How-To Guide: Implementing a New Table**

This guide provides a step-by-step recipe for creating a new data table. We will use the example of creating a **Users Table**.

#### **Step 1: Create the `columns.jsx` File**

First, define the "blueprint" for your new table. Create a new file at `frontend/src/components/Users/Table/columns.jsx`.

This file will define what each column looks like and how it behaves.

```javascript
// frontend/src/components/Users/Table/columns.jsx

'use client';

import { DataTableColumnHeader } from '../../ui/tables/data-table-column-header';
import { DataTableRowActions } from '../../ui/tables/data-table-row-actions';
import { Badge } from '../../ui/badge';

export const columns = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: {
      headerTitle: "Name",
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    enableHiding: false, // This is an essential column
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: {
      headerTitle: "Email",
    },
    cell: ({ row }) => <a href={`mailto:${row.getValue('email')}`} className="hover:underline">{row.getValue('email')}</a>
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    meta: {
      headerTitle: "Role",
    },
    cell: ({ row }) => {
      const role = row.getValue('role');
      const variant = role === 'admin' ? 'default' : 'outline';
      return <Badge variant={variant}>{role}</Badge>;
    }
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      // Access onEdit and onDelete from the meta prop passed to <DataTable>
      const meta = table.options.meta;
      return (
        <DataTableRowActions
          row={row}
          onEdit={meta?.onEdit}
          onDelete={meta?.onDelete}
        />
      );
    },
    enableHiding: false,
  },
];
```

#### **Step 2: Create the Consumer Page Component**

Next, create the page where the table will be displayed, for example, `frontend/src/pages/UserListPage.jsx`. This component will fetch the data and wire everything together.

```javascript
// frontend/src/pages/UserListPage.jsx

import { useState, useEffect, useCallback, useContext } from 'react';
import { DataTable } from '../components/ui/tables/data-table';
import { DataTableToolbar } from '../components/ui/tables/data-table-toolbar';
import { columns as userTableColumns } from '../components/Users/Table/columns';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
// Assume we will create these components and context later
// import UserContext from '../context/UserContext';
// import AddUserModal from '../components/Users/AddUserModal';
// import EditUserModal from '../components/Users/EditUserModal';
// import ConfirmationModal from '../components/Common/ConfirmationModal';

const UserListPage = () => {
  // const { users, fetchUsers, deleteUser, isLoading, error } = useContext(UserContext);
  // For this example, we'll use mock data.
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob Williams', email: 'bob@example.com', role: 'user' },
  ]);

  const [reactTableInstance, setReactTableInstance] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});

  // --- Define State for Modals ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- Define Action Handlers ---
  const handleEditUser = useCallback((user) => {
    console.log('Editing user:', user);
    setUserToEdit(user);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteUser = useCallback((user) => {
    console.log('Deleting user:', user);
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }, []);

  // In a real app, you would fetch users here, e.g.,
  // useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="flex flex-col flex-1 h-full p-4 md:p-8 gap-8">
      <h2 className="text-2xl font-semibold">Users</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-end mb-2 gap-2">
          {!!reactTableInstance && (
            <DataTableToolbar
              table={reactTableInstance}
              columnVisibility={columnVisibility}
            />
          )}
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
        <DataTable
          columns={userTableColumns}
          data={users}
          meta={{
            onEdit: handleEditUser,
            onDelete: handleDeleteUser,
          }}
          onTableInstanceReady={setReactTableInstance}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      {/* Modals would be placed here */}
      {/* <EditUserModal user={userToEdit} isOpen={isEditModalOpen} ... /> */}
      {/* <ConfirmationModal title="Delete User" isOpen={isDeleteModalOpen} ... /> */}
    </div>
  );
};

export default UserListPage;
```

#### **Step 3: Add Modals and Context (If Needed)**

Following the existing patterns in `ProjectListPage` and `ProjectTasksPage`:
1.  Create `AddUserModal.jsx` and `EditUserModal.jsx`.
2.  Create a `UserContext.jsx` to handle fetching, adding, updating, and deleting users via API calls.
3.  Use the reusable `ConfirmationModal.jsx` for the delete action.

#### **Step 4: Review and Verify**

Run the application and navigate to your new `UserListPage`.
-   Does the table render with the correct data?
-   Does sorting on the "Name" and "Email" columns work?
-   Can you toggle the visibility of the "Role" column from the "View" menu?
-   When you click "Edit" or "Delete" on a row, do the `console.log` messages appear with the correct user data? (This confirms the `meta` prop is working correctly).


Of course. Here is the final section of your guide, the "Component API Reference." This will serve as a quick-reference for developers using your custom table components.

---

### **4. Component API Reference**

This section provides a detailed breakdown of the props for our primary reusable table components located in `frontend/src/components/ui/tables/`.

#### **`<DataTable />`**

This is the main component that orchestrates the entire table. It initializes Tanstack Table and renders the final `<table>` element with its headers, body, and rows.

| Prop Name                  | Type                    | Required? | Description                                                                                                                                              |
| -------------------------- | ----------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`                  | `ColumnDef[]`           | **Yes**   | The array of column definitions that serves as the blueprint for the table.                                                                              |
| `data`                     | `object[]`              | **Yes**   | The array of data objects to be rendered in the table rows.                                                                                              |
| `meta`                     | `object`                | No        | An object to pass arbitrary data and functions to the table instance. Primarily used to provide action handlers (e.g., `onEdit`, `onDelete`) to other components. |
| `columnVisibility`         | `object`                | No        | A state object that controls which columns are currently visible. This should be managed by the parent page component to allow sharing with the toolbar.  |
| `onColumnVisibilityChange` | `function`              | No        | The setter function for the `columnVisibility` state. This allows the table's column menu to update the parent component's state.                          |
| `onTableInstanceReady`     | `(instance) => void`    | No        | A callback that receives the Tanstack Table instance once it's initialized. This is useful for passing the instance to sibling components like the toolbar. |

---

#### **`<DataTableToolbar />`**

A component intended to be placed above the `<DataTable />` to hold controls like filters or the column visibility toggle.

| Prop Name          | Type                 | Required?                            | Description                                                                                                                           |
| ------------------ | -------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `table`            | `Table` (Tanstack)   | **Yes**                              | The Tanstack Table instance, which is typically retrieved from the parent page via the `onTableInstanceReady` prop of `<DataTable />`. |
| `columnVisibility` | `object`             | No (but required for toggle to sync) | The same `columnVisibility` state object passed to `<DataTable />`. This is used by `<DataTableColumnToggle />` to display checkbox states correctly. |

---

#### **`<DataTableColumnHeader />`**

A specialized component used within a column's `header` definition to automatically provide sorting UI and functionality.

| Prop Name   | Type               | Required? | Description                                                      |
| ----------- | ------------------ | --------- | ---------------------------------------------------------------- |
| `column`    | `Column` (Tanstack)| **Yes**   | The column instance provided by the `header` render function.    |
| `title`     | `string`           | **Yes**   | The string title to display for the column header.               |
| `className` | `string`           | No        | Optional CSS classes to apply to the component for custom styling. |

---

#### **`<DataTableRowActions />`**

The "..." dropdown menu component used within a row's `cell` definition to provide actions like "Edit" and "Delete".

| Prop Name   | Type                     | Required? | Description                                                                                                       |
| ----------- | ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `row`       | `Row` (Tanstack)         | **Yes**   | The row instance provided by the `cell` render function. This is used to access the original data for the actions. |
| `onEdit`    | `(rowData) => void`      | No        | A callback function executed when the "Edit" menu item is clicked. It receives the original row data object.     |
| `onDelete`  | `(rowData) => void`      | No        | A callback function executed when the "Delete" menu item is clicked. It receives the original row data object.   |