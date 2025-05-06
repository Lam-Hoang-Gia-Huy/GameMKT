import React, { useEffect, useState } from "react";
import { apiAuth } from "../../api/apiClient";

const RecentProjects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiAuth.get("/api/Project/GetProjectByUserId");
        const sortedProjects = [...response.data.data]
          .sort(
            (a, b) => new Date(b["end-datetime"]) - new Date(a["end-datetime"])
          )
          .slice(0, 5);
        setProjects(sortedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="recent-projects">
      <h3>Recent Projects</h3>
      <ul className="project-list">
        {projects.map((project) => (
          <li key={project["project-id"]} className="project-item">
            <div className="project-content">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="project-thumbnail"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
              <div className="project-details">
                <h4>{project.title}</h4>
                <div className="project-meta">
                  <span
                    className={`status ${project[
                      "transaction-status"
                    ].toLowerCase()}`}
                  >
                    {project["transaction-status"]}
                  </span>
                  <span>${project["total-amount"]}</span>
                  <span>
                    {new Date(project["end-datetime"]).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentProjects;
