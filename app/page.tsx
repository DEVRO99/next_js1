"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createClient } from "@/utils/supabase/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  status: "todo" | "progress" | "done";
};

export default function Home() {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");

  // LOAD TASKS FROM SUPABASE
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load tasks: " + error.message);
      } else {
        setTasks(data as Task[]);
      }

      setLoading(false);
    };

    loadTasks();
  }, []);

  // EDIT TASK
  const editTask = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setDate(task.date || "");
    setStatus(task.status);
    setShowForm(true);
  };

  // ADD / UPDATE TASK
  const addTask = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      date: date || null,
      status,
      updated_at: new Date().toISOString(),
    };

    if (editingId !== null) {
      // UPDATE TASK IN SUPABASE
      const { data, error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        toast.error("Failed to update task: " + error.message);
        return;
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === editingId ? (data as Task) : task,
        ),
      );

      toast.success("Task updated successfully!");
    } else {
      // CREATE TASK IN SUPABASE
      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) {
        toast.error("Failed to create task: " + error.message);
        return;
      }

      setTasks((previousTasks) => [data as Task, ...previousTasks]);

      toast.success("Task created successfully!");
    }

    // RESET FORM
    setTitle("");
    setDescription("");
    setDate("");
    setStatus("todo");
    setEditingId(null);
    setShowForm(false);
  };

  // DELETE TASK
  const deleteTask = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete task: " + error.message);
      return;
    }

    setTasks((previousTasks) => previousTasks.filter((task) => task.id !== id));

    toast.success("Task deleted successfully!");
  };

  // TASK COLUMNS
  const columns = [
    { id: "todo", title: "To Do", color: "bg-gray-400" },
    { id: "progress", title: "In Progress", color: "bg-purple-500" },
    { id: "done", title: "Done", color: "bg-orange-500" },
  ];

  return (
    <main className="min-h-screen bg-[#e9e3ff] p-3 sm:p-6">
      <div className="mx-auto flex min-h-[90vh] max-w-[1500px] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* SIDEBAR */}
        <aside className="w-56 shrink-0 border-r bg-white p-6">
          <h1 className="mb-10 text-2xl font-bold text-gray-900">Todo App</h1>

          <h2 className="mb-6 text-xl font-bold text-gray-900">My Tasks</h2>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1 bg-[#f8f7ff] p-5 sm:p-8">
          {/* ADD TASK FORM */}
          {showForm && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-gray-800">
                {editingId !== null ? "Edit Task" : "Add New Task"}
              </h3>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-400 outline-none focus:border-purple-500"
                />

                <textarea
                  placeholder="Task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-500"
                  rows={3}
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-500"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task["status"])}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-500"
                >
                  <option value="todo">To Do</option>
                  <option value="progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={addTask}
                    className="rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700"
                  >
                    {editingId !== null ? "Update Task" : "Save Task"}
                  </button>

                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setTitle("");
                      setDescription("");
                      setDate("");
                      setStatus("todo");
                    }}
                    className="rounded-xl bg-gray-100 px-5 py-3 font-medium text-gray-600 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD HEADER */}
          {!showForm && (
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  My Dashboard
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage your daily tasks easily.
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700"
              >
                + Add Task
              </button>
            </header>
          )}

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-5 w-full max-w-md rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-800 outline-none focus:border-purple-500"
          />

          {/* TASK BOARD */}
          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading tasks...</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {columns.map((column) => {
                const columnTasks = tasks.filter((task) => {
                  const matchesStatus = task.status === column.id;

                  const matchesSearch =
                    (task.title || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    (task.description || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());

                  return matchesStatus && matchesSearch;
                });

                return (
                  <div
                    key={column.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    {/* COLUMN HEADER */}
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${column.color}`}
                        />

                        <h3 className="font-bold text-gray-800">
                          {column.title}
                        </h3>

                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                          {columnTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setStatus(column.id as Task["status"]);
                          setEditingId(null);
                          setTitle("");
                          setDescription("");
                          setDate("");
                          setShowForm(true);
                        }}
                        className="text-xl text-gray-500 hover:text-purple-600"
                      >
                        +
                      </button>
                    </div>

                    {/* TASK CARDS */}
                    <div className="space-y-4">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-gray-200 p-4 transition hover:-translate-y-1 hover:shadow-md"
                        >
                          <h4 className="font-semibold text-gray-800">
                            {task.title}
                          </h4>

                          <p className="mt-2 text-sm text-gray-500">
                            {task.description || "No description"}
                          </p>

                          <div className="mt-5 flex items-center justify-between">
                            <span className="rounded-full bg-gray-100 px-3 py-2 text-xs text-gray-500">
                              {task.date || "No date"}
                            </span>

                            <div className="flex gap-3">
                              <button
                                onClick={() => editTask(task)}
                                className="text-sm font-semibold text-purple-600 hover:text-purple-800"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-sm font-semibold text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {columnTasks.length === 0 && (
                        <p className="py-5 text-center text-sm text-gray-400">
                          No tasks yet
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
