import axios from "axios";
import qs from "qs";

const apiBase = axios.create({
  baseURL: "https://marvelous-gentleness-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});
export const apiAuth = axios.create({
  baseURL: "https://marvelous-gentleness-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});
apiAuth.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const submitProject = (projectId, note) => {
  return apiAuth.put(
    `/api/Project/Submit?projectId=${projectId}&note=${encodeURIComponent(
      note
    )}`,
    null,
    {
      headers: {
        Accept: "*/*",
      },
    }
  );
};

// ... (all other existing functions remain unchanged)
export const createPaypalPayment = (projectId, amount) => {
  return apiAuth.post(
    `/api/PaypalPayment/create?projectId=${projectId}&amount=${amount}`
  );
};
export const executePaypalPayment = (paymentId, token, payerId) => {
  return apiAuth.get(`/api/PaypalPayment/execute`, {
    params: { paymentId, token, PayerID: payerId },
  });
};
export const fetchCreatorInfo = (userId) =>
  apiBase.get(`/api/User/GetUserByUserId?userId=${userId}`);
export const fetchRewardsByProjectId = (id) =>
  apiAuth.get(`/api/Reward/GetRewardByProjectId?projectId=${id}`);
export const fetchProjectsAdmin = () =>
  apiAuth.get("/api/Project/GetAllProjectByMonitor");
export const fetchUserProjects = () =>
  apiAuth.get("/api/Project/GetProjectByUserId");
export const deleteProject = (projectId) =>
  apiAuth.delete(`/api/Project/DeleteProject?id=${projectId}`);
export const staffApproveProject = ({ projectId, status, reason }) => {
  return apiAuth.put(`/api/Project/StaffApproveProject`, null, {
    params: { projectId, status, reason },
  });
};
export const fetchProjects = (filters = {}, pageNumber = 1, pageSize = 6) => {
  const queryParams = {
    pageNumber,
    pageSize,
  };
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null) {
      if (key.includes("Datetime") && filters[key]?.isValid?.()) {
        queryParams[key] = filters[key];
      } else if (
        Array.isArray(filters[key]) &&
        filters[key].every((item) => item?.isValid?.())
      ) {
        queryParams[`Min${key}`] = filters[key][0];
        queryParams[`Max${key}`] = filters[key][1];
      } else if (key === "CategoryIds" || key === "PlatformIds") {
        queryParams[key] = filters[key];
      } else {
        queryParams[key] = filters[key];
      }
    }
  });

  return apiAuth.get("/api/Project/GetProjectsPaging", {
    params: queryParams,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};
export const fetchProject = (id) =>
  apiAuth.get(`/api/Project/GetProjectById?id=${id}`);
export const createProject = (data) => {
  const formData = new FormData();
  formData.append("Title", data.Title);
  formData.append("Description", data.Description);
  formData.append("MinimumAmount", Number(data.MinimumAmount || 0).toString());
  formData.append("StartDatetime", data.StartDatetime);
  formData.append("EndDatetime", data.EndDatetime);

  return apiAuth.post("/api/Project/CreateProject", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const registerUser = (data) =>
  apiBase.post("/api/Authentication/register", data);
export const login = (data) => apiBase.post("/api/Authentication/login", data);
export const getComment = (data) => apiBase.get("/api/Comment", data);
export const updateProject = (id, data) => {
  const formData = new FormData();

  if (data.Title) formData.append("Title", data.Title);
  if (data.Description) formData.append("Description", data.Description);
  if (data.MinimumAmount != null)
    formData.append("MinimumAmount", data.MinimumAmount.toString());
  if (data.StartDatetime) formData.append("StartDatetime", data.StartDatetime);
  if (data.EndDatetime) formData.append("EndDatetime", data.EndDatetime);

  return apiAuth.put(`/api/Project/UpdateProject?projectId=${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const updateThumbnail = (projectId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiAuth.put(
    `/api/Project/UpdateProjectThumbnail?projectId=${projectId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
export const updateStory = (projectId, story) => {
  return apiAuth.put(
    `/api/Project/UpdateProjectStory?projectId=${projectId}&story=${encodeURIComponent(
      story
    )}`,
    null
  );
};

export const addReward = (data) => apiAuth.post("/api/Reward/AddReward", data);

export const updateReward = (rewardId, data) => {
  const formData = new FormData();
  formData.append("Amount", data.amount);
  formData.append("Details", data.details);
  formData.append("CreatedDatetime", data["created-datetime"]);
  return apiAuth.put(
    `/api/Reward/UpdateReward?rewardId=${rewardId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
export const deleteReward = (rewardId) =>
  apiAuth.delete(`/api/Reward/DeleteReward?rewardId=${rewardId}`);
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("formFiles", file);

  return apiAuth.post("/api/File", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const deleteFile = (fileId) =>
  apiAuth.delete(`/api/File/Remove?fileId=${fileId}`);

export const getUserFiles = (userId, page = 1, pageSize = 20) =>
  apiAuth.get(
    `/api/File/files/user/paging/${userId}?page=${page}&pageSize=${pageSize}`
  );

export const getFileById = (fileId) => apiAuth.get(`/api/File/file/${fileId}`);
export const fetchAllCategories = () =>
  apiBase.get("/api/Category/GetAllCategory");

export const addCategoryToProject = (projectId, categoryId) => {
  const formData = new FormData();
  formData.append("ProjectId", projectId);
  formData.append("CategoryId", categoryId);

  return apiAuth.post("/api/Project/AddCategoryToProject", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const fetchProjectCategories = (projectId) =>
  apiAuth.get(`/api/Category/GetAllCategoryByProjectId?projecId=${projectId}`);

export const removeCategoryFromProject = (projectId, categoryId) =>
  apiAuth.delete(
    `/api/Category/DeleteCategoryFromProject?projectId=${projectId}&categoryId=${categoryId}`
  );
export const fetchPledgesByUserId = () => {
  return apiAuth.get("/api/Pledge/GetPledgeByUserId");
};
// FAQ APIs
export const addFaq = (projectId, question, answer) => {
  const formData = new FormData();
  formData.append("Question", question);
  formData.append("Answer", answer);

  return apiAuth.post(`/api/Faq/AddFaq?projectId=${projectId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getFaqsByProjectId = (projectId) =>
  apiAuth.get(`/api/Faq/GetFaqByProjectId?projectId=${projectId}`);

export const updateFaq = (projectId, oldQuestion, newQuestion, answer) => {
  const formData = new FormData();
  formData.append("Question", newQuestion);
  formData.append("Answer", answer);

  return apiAuth.put(
    `/api/Faq/UpdateFaq?projectId=${projectId}&oldQuestion=${encodeURIComponent(
      oldQuestion
    )}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const deleteFaq = (projectId, question) =>
  apiAuth.delete(
    `/api/Faq/DeleteFaq?projectId=${projectId}&question=${encodeURIComponent(
      question
    )}`
  );
export const editCollaboratorRole = (userId, projectId, role) => {
  const formData = new FormData();
  formData.append("UserId", userId);
  formData.append("ProjectId", projectId);
  formData.append("Role", role);

  return apiAuth.put("/api/Collaborator", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const createCollaborator = (email, projectId, role) => {
  const formData = new FormData();
  formData.append("Email", email);
  formData.append("ProjectId", projectId);
  formData.append("Role", role);

  return apiAuth.post("/api/Collaborator/CreateCollaboratorByEmail", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Get collaborators for a project
export const getProjectCollaborators = (projectId) => {
  return apiAuth.get(`/api/Collaborator/project?projectId=${projectId}`);
};

// Remove collaborator from project
export const removeCollaborator = (userId, projectId) => {
  return apiAuth.delete(
    `/api/Collaborator?userId=${userId}&projectId=${projectId}`
  );
};
export const fetchAllPlatforms = () =>
  apiBase.get("/api/Platform/Platform/GetAll");
export const addPlatformToProject = (projectId, platformId) => {
  const formData = new FormData();
  formData.append("PlatformId", platformId);
  formData.append("ProjectId", projectId);

  return apiAuth.post("/api/Platform/project/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const removePlatformFromProject = (projectId, platformId) => {
  const formData = new FormData();
  formData.append("PlatformId", platformId);
  formData.append("ProjectId", projectId);

  return apiAuth.delete("/api/Platform/project/delete", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getCollaboratorProjects = (userId) => {
  return apiAuth.get(`/api/Collaborator/user?userId=${userId}`);
};
export const resendConfirmationEmail = (email) => {
  return apiBase.post(
    `/api/Authentication/resend?sEmail=${encodeURIComponent(email)}`,
    null,
    {
      headers: {
        Accept: "*/*",
      },
    }
  );
};
export const fetchCommentsByProjectId = (projectId) =>
  apiBase.get(`/api/Comment/GetCommentsByProjectId?projectId=${projectId}`);

export const addComment = (projectId, content, parentCommentId = "") => {
  const formData = new FormData();
  formData.append("ProjectId", projectId);
  formData.append("Content", content);
  formData.append("ParentCommentId", parentCommentId);
  return apiAuth.post("/api/Comment/project", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateComment = (commentId, content) => {
  const formData = new FormData();
  formData.append("CommentId", commentId);
  formData.append("Content", content);
  return apiAuth.put("/api/Comment/UpdateComment", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteComment = (commentId) =>
  apiAuth.delete(`/api/Comment/DeleteComment?commentId=${commentId}`);
// Report APIs
export const createReport = (detail) => {
  return apiAuth.post("/api/Report/CreateReport", { detail });
};
export const addCommentToPost = (postId, content, parentCommentId = "") => {
  const formData = new FormData();
  formData.append("PostId", postId);
  formData.append("Content", content);
  formData.append("ParentCommentId", parentCommentId);
  return apiAuth.post("/api/Comment/post", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const fetchCommentsByPostId = (postId) =>
  apiBase.get(`/api/Comment/GetComment?postId=${postId}`);

export const fetchReportsByUserId = () => {
  return apiAuth.get("/api/Report/GetReportByUserId");
};
// Post APIs
export const createPost = (data) => {
  const formData = new FormData();
  formData.append("ProjectId", data.ProjectId);
  formData.append("Title", data.Title);
  formData.append("Description", data.Description);
  formData.append("Status", data.Status);
  return apiAuth.post("/api/Post", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const fetchPostsByProject = (projectId, page = 1, pageSize = 20) => {
  return apiAuth.get(
    `/api/Post/pagination/project?projectId=${projectId}&page=${page}&pageSize=${pageSize}`
  );
};

export const getPostById = (postId) => {
  return apiAuth.get(`/api/Post/GetPost?postId=${postId}`);
};

export const updatePost = (postId, data) => {
  const formData = new FormData();
  formData.append("ProjectId", data.ProjectId);
  formData.append("Title", data.Title);
  formData.append("Description", data.Description);
  formData.append("Status", data.Status);
  return apiAuth.put(`/api/Post/Update?postId=${postId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePost = (postId) => {
  return apiAuth.delete(`/api/Post/DeletePost?postId=${postId}`);
};
export const exportPledgesToExcel = (projectId) => {
  return apiAuth.get(`/api/Pledge/ExportPledgesToExcel/${projectId}`, {
    responseType: "blob",
    headers: {
      Accept: "*/*",
    },
  });
};

// Send verification code to email
export const sendVerificationCode = (email) => {
  const formData = new FormData();
  formData.append("email", email);

  return apiBase.post("/api/ForgotPassword/Send-Code", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "*/*",
    },
  });
};
// Verify the code
export const verifyCode = (email, code) => {
  return apiBase.get("/api/ForgotPassword/Verify-Code", {
    params: { email, code },
    headers: {
      Accept: "*/*",
    },
  });
};
// Reset password
export const resetPassword = (email, newPassword) => {
  return apiBase.post(
    `/api/ForgotPassword/Reset-Password?email=${encodeURIComponent(
      email
    )}&newPassword=${encodeURIComponent(newPassword)}`,
    null,
    {
      headers: {
        Accept: "*/*",
      },
    }
  );
};
export const createPlatform = (data) => {
  const formData = new FormData();
  formData.append("Name", data.Name);
  formData.append("Description", data.Description);

  return apiAuth.post("/api/Platform/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updatePlatform = (platformId, data) => {
  const formData = new FormData();
  formData.append("Name", data.Name);
  formData.append("Description", data.Description);

  return apiAuth.put(`/api/Platform?platformId=${platformId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deletePlatform = (platformId) =>
  apiAuth.delete(`/api/Platform?platformId=${platformId}`);
// Category APIs
export const createCategory = (data) => {
  const formData = new FormData();
  if (data.ParentCategoryId) {
    formData.append("ParentCategoryId", data.ParentCategoryId);
  }
  formData.append("Name", data.Name);
  formData.append("Description", data.Description);

  return apiAuth.post("/api/Category/AddCategory", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateCategory = (categoryId, data) => {
  return apiAuth.put(
    `/api/Category/UpdateCategory?categoryId=${categoryId}`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const deleteCategory = (categoryId) =>
  apiAuth.delete(`/api/Category/DeleteCategory?categoryId=${categoryId}`);
export const refundAllPledges = (projectId) =>
  apiAuth.post(
    `/api/PaypalPayment/RefundAllPledgesForProject?projectId=${projectId}`,
    null,
    {
      headers: {
        Accept: "*/*",
      },
    }
  );
export const fetchAllReports = () => {
  return apiAuth.get("/api/Report/GetAllReport", {
    headers: {
      Accept: "*/*",
    },
  });
};

export const fetchReportById = (reportId) => {
  return apiAuth.get(`/api/Report/GetReportById?reportId=${reportId}`, {
    headers: {
      Accept: "*/*",
    },
  });
};
export const fetchAllUsers = () => {
  return apiAuth.get("/api/User/GetAllUser", {
    headers: {
      Accept: "*/*",
    },
  });
};

export const deleteUser = (userDeleteId) => {
  return apiAuth.delete(`/api/User/DeleteUser?UserDeleteId=${userDeleteId}`, {
    headers: {
      Accept: "*/*",
    },
  });
};
export const transferPledgesToCreator = (projectId) => {
  return apiAuth.post(
    `/api/PaypalPayment/TransferPledgeToCreator?projectId=${projectId}`,
    null,
    {
      headers: {
        Accept: "*/*",
      },
    }
  );
};
export const checkProjectPermissions = (projectId) => {
  return apiAuth.get(
    `/api/Authentication/CheckIfUserHasPermissionsToUpdateOrDeleteByProjectId?projectId=${projectId}`,
    {
      headers: {
        Accept: "*/*",
      },
    }
  );
};
