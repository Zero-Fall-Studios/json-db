/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import type {
  ColumnData,
  ColumnType,
  Database,
  Row,
  Schema,
} from "~/types/database.types";
import { removeItemAtIndex } from "~/utils/removeItemAtIndex";

export type DatabaseContextProps = {
  database: Database;
  setDatabaseName: (name: string) => void;
  addTable: (tableName: string) => void;
  viewSchema: (tableName: string) => void;
  viewData: (tableName: string) => void;
  selectedTable: string;
  selectedView: string;
  schema: Schema;
  addColumn: (columnName: string) => void;
  deleteColumn: (columnName: string) => void;
  onChangeType: (columnName: string, value: string) => void;
  onChangePossibleValues: (columnName: string, values: string[]) => void;
  onChangeDefaultValues: (columnName: string, values: string[]) => void;
  addRow: (data: any) => void;
  onColumnValueChange: (
    rowIndex: number,
    columnName: string,
    newValue: any
  ) => void;
  getCurrentValue: (rowIndex: number, columnName: string) => any;
  exportData: (tableName: string) => void;
  deleteRow: (index: number) => void;
  setDatabaseFromString: (dataStr: string) => void;
};

const DatabaseContext = createContext<DatabaseContextProps | null>(null);

type ProviderProps = {
  children?: React.ReactNode;
};

const DatabaseProvider: React.FC<ProviderProps> = ({ children }) => {
  const [database, setDatabase] = useLocalStorage<Database>("database", {
    name: "",
    tables: {},
  });
  const [selectedTable, setSelectedTable] = useLocalStorage(
    "selectedTable",
    ""
  );
  const [selectedView, setSelectedView] = useLocalStorage<"schema" | "data">(
    "selectedView",
    "schema"
  );
  const [firstRender, setFirstRender] = useState(true);

  const setDatabaseName = (name: string) => {
    const dbCopy = { ...database };
    dbCopy.name = name;
    setDatabase(dbCopy);
  };

  const addTable = (tableName: string) => {
    if (!database.tables[tableName]) {
      const dbCopy = { ...database };
      dbCopy.tables = {
        ...dbCopy.tables,
        [tableName]: { schema: {}, data: [] },
      };
      setDatabase(dbCopy);
    } else {
      alert("Table already exists");
    }
  };

  const [schema, setSchema] = useState<Schema>({});

  const addColumn = (columnName: string) => {
    if (!schema[columnName]) {
      const newSchema = { ...schema };
      newSchema[columnName] = { type: "string" };
      setSchema(newSchema);

      if (selectedTable) {
        const dbCopy = { ...database };
        dbCopy.tables = {
          ...dbCopy.tables,
          [selectedTable]: {
            schema: newSchema,
            data: dbCopy.tables[selectedTable]?.data ?? [],
          },
        };
        setDatabase(dbCopy);
      }
    }
  };

  const deleteColumn = (columnName: string) => {
    if (schema[columnName]) {
      const newSchema = { ...schema };
      delete newSchema[columnName];
      setSchema(newSchema);
      if (selectedTable) {
        const dbCopy = { ...database };
        dbCopy.tables = {
          ...dbCopy.tables,
          [selectedTable]: {
            schema: newSchema,
            data: dbCopy.tables[selectedTable]?.data ?? [],
          },
        };
        setDatabase(dbCopy);
      }
    }
  };

  const onChangeType = (columnName: string, value: string) => {
    if (schema[columnName]) {
      const newSchema = { ...schema };
      newSchema[columnName] = {
        ...newSchema[columnName],
        type: value as ColumnType,
      };
      setSchema(newSchema);
      if (selectedTable) {
        const dbCopy = { ...database };
        dbCopy.tables = {
          ...dbCopy.tables,
          [selectedTable]: {
            schema: newSchema,
            data: dbCopy.tables[selectedTable]?.data ?? [],
          },
        };
        setDatabase(dbCopy);
      }
    }
  };

  const onChangePossibleValues = (columnName: string, values: string[]) => {
    if (schema[columnName]) {
      const newSchema = { ...schema };
      newSchema[columnName] = {
        type: newSchema[columnName]?.type ?? "null",
        possible_values: values,
      };
      setSchema(newSchema);
      if (selectedTable) {
        const dbCopy = { ...database };
        dbCopy.tables = {
          ...dbCopy.tables,
          [selectedTable]: {
            schema: newSchema,
            data: dbCopy.tables[selectedTable]?.data ?? [],
          },
        };
        setDatabase(dbCopy);
      }
    }
  };

  const onChangeDefaultValues = (columnName: string, values: string[]) => {
    if (schema[columnName]) {
      const newSchema = { ...schema };
      newSchema[columnName] = {
        ...newSchema[columnName],
        default_values: values,
      } as ColumnData;
      setSchema(newSchema);
      if (selectedTable) {
        const dbCopy = { ...database };
        dbCopy.tables = {
          ...dbCopy.tables,
          [selectedTable]: {
            schema: newSchema,
            data: dbCopy.tables[selectedTable]?.data ?? [],
          },
        };
        setDatabase(dbCopy);
      }
    }
  };

  const viewSchema = useCallback(
    (tableName: string) => {
      setSelectedTable(tableName);
      setSelectedView("schema");
      if (database.tables[tableName]?.schema) {
        setSchema(database.tables[tableName]?.schema ?? {});
      }
    },
    [database.tables, setSelectedTable, setSelectedView]
  );
  const viewData = useCallback(
    (tableName: string) => {
      setSelectedView("data");
      setSelectedTable(tableName);
      if (database.tables[tableName]?.schema) {
        setSchema(database.tables[tableName]?.schema ?? {});
      }
    },
    [database.tables, setSelectedTable, setSelectedView]
  );
  const exportData = (tableName: string) => {
    const data = database.tables[tableName]?.data ?? [];
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName}.json`;
    a.click();
  };

  const addRow = (data: any) => {
    if (selectedTable) {
      const schema = database.tables[selectedTable]?.schema ?? {};
      const prevData = database.tables[selectedTable]?.data ?? [];
      const dbCopy = { ...database };
      dbCopy.tables = {
        ...dbCopy.tables,
        [selectedTable]: { schema, data: [...prevData, data] },
      };
      setDatabase(dbCopy);
    }
  };

  const deleteRow = (index: number) => {
    if (selectedTable) {
      const schema = database.tables[selectedTable]?.schema ?? {};
      let prevData = database.tables[selectedTable]?.data ?? [];
      const dbCopy = { ...database };
      prevData = removeItemAtIndex(prevData, index);
      dbCopy.tables = {
        ...dbCopy.tables,
        [selectedTable]: { schema, data: [...prevData] },
      };
      setDatabase(dbCopy);
    }
  };

  const onColumnValueChange = (
    rowIndex: number,
    columnName: string,
    newValue: any
  ) => {
    if (selectedTable) {
      const schema = database.tables[selectedTable]?.schema ?? {};
      const newData = database.tables[selectedTable]?.data ?? [];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnName]: newValue,
      } as Row;
      const dbCopy = { ...database };
      dbCopy.tables = {
        ...dbCopy.tables,
        [selectedTable]: { schema, data: [...newData] },
      };
      setDatabase(dbCopy);
    }
  };

  const getCurrentValue = (rowIndex: number, columnName: string) => {
    if (selectedTable) {
      const newData = database.tables[selectedTable]?.data ?? [];
      return newData?.[rowIndex]?.[columnName] ?? null;
    }
    return null;
  };

  const setDatabaseFromString = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr) as Database;
      setDatabase(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (firstRender) {
      if (selectedTable) {
        if (selectedView === "schema") {
          viewSchema(selectedTable);
        } else if (selectedView === "data") {
          viewData(selectedTable);
        }
      }
      setFirstRender(false);
    }
  }, [firstRender, selectedTable, selectedView, viewData, viewSchema]);

  return (
    <DatabaseContext.Provider
      value={{
        database,
        setDatabaseName,
        addTable,
        viewSchema,
        viewData,
        selectedTable,
        selectedView,
        schema,
        addColumn,
        deleteColumn,
        onChangeType,
        onChangePossibleValues,
        onChangeDefaultValues,
        addRow,
        onColumnValueChange,
        getCurrentValue,
        exportData,
        deleteRow,
        setDatabaseFromString,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  return useContext(DatabaseContext) as DatabaseContextProps;
};

export { DatabaseContext, DatabaseProvider };
