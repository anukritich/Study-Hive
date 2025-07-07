import React, { useState, useEffect } from "react";

const StudyPlan = () => {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/study-plan/user123")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const addTask = () => {
    fetch("http://localhost:5000/study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user123", task }),
    }).then(() => {
      setTasks([...tasks, { task, completed: false }]);
      setTask("");
    });
  };

  const toggleTask = (taskId) => {
    fetch(`http://localhost:5000/study-plan/user123/${taskId}`, { method: "PUT" })
      .then(() => {
        setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Study Plan</h1>
      <div className="mt-4">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="p-2 border rounded-md"
        />
        <button onClick={addTask} className="ml-2 bg-green-500 text-white p-2 rounded-md">
          Add Task
        </button>
      </div>
      <ul className="mt-4">
        {tasks.map((t, index) => (
          <li key={index} className="p-2 bg-gray-100 rounded-md mt-2">
            <input
              type="checkbox"
              checked={t.completed}
              onChange={() => toggleTask(t.id)}
              className="mr-2"
            />
            {t.task}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudyPlan;
