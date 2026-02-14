import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/api";
import TemplateForm from "../components/TemplateForm";
import RuleTable from "../components/RuleTable";
import SchemaViewer from "../components/SchemaViewer";

const emptyUser = {
  name: "",
  email: "",
  password: "",
  role: "аналитик",
};

const emptyRequirement = {
  templateId: "",
  title: "",
  details: "",
  status: "draft",
  analystId: "",
};

function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState(null);

  const [editingTemplate, setEditingTemplate] = useState(null);

  const [requirementForm, setRequirementForm] = useState(emptyRequirement);
  const [editingRequirementId, setEditingRequirementId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const parseError = (apiError) =>
    apiError?.response?.data?.message || apiError.message || "Неизвестная ошибка";

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, templatesResponse, requirementsResponse, rulesResponse] = await Promise.all([
        adminApi.listUsers(),
        adminApi.listTemplates(),
        adminApi.listRequirements(),
        adminApi.listRules(),
      ]);

      const loadedTemplates = templatesResponse.data;
      setUsers(usersResponse.data);
      setTemplates(loadedTemplates);
      setRequirements(requirementsResponse.data);
      setRules(rulesResponse.data);

      if (loadedTemplates.length && !selectedTemplateId) {
        const firstId = loadedTemplates[0].id;
        setSelectedTemplateId(firstId);
        setRequirementForm((prev) => ({ ...prev, templateId: String(firstId) }));
      }
      setError("");
    } catch (apiError) {
      setError(parseError(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitUser = async (event) => {
    event.preventDefault();
    try {
      if (editingUserId) {
        const payload = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
        };
        if (userForm.password) {
          payload.password = userForm.password;
        }
        await adminApi.updateUser(editingUserId, payload);
        setMessage("Пользователь обновлен");
      } else {
        await adminApi.createUser(userForm);
        setMessage("Пользователь создан");
      }
      setUserForm(emptyUser);
      setEditingUserId(null);
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const editUser = (targetUser) => {
    setEditingUserId(targetUser.id);
    setUserForm({
      name: targetUser.name,
      email: targetUser.email,
      password: "",
      role: targetUser.role,
    });
  };

  const removeUser = async (id) => {
    if (!window.confirm("Удалить пользователя?")) {
      return;
    }
    try {
      await adminApi.deleteUser(id);
      setMessage("Пользователь удален");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const createTemplate = async (payload) => {
    try {
      await adminApi.createTemplate(payload);
      setMessage("Шаблон создан");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const updateTemplate = async (payload) => {
    if (!editingTemplate) {
      return;
    }
    try {
      await adminApi.updateTemplate(editingTemplate.id, payload);
      setEditingTemplate(null);
      setMessage("Шаблон обновлен");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const removeTemplate = async (id) => {
    if (!window.confirm("Удалить шаблон?")) {
      return;
    }
    try {
      await adminApi.deleteTemplate(id);
      setMessage("Шаблон удален");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const submitRequirement = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        templateId: Number(requirementForm.templateId),
        title: requirementForm.title,
        details: requirementForm.details,
        status: requirementForm.status,
        analystId: requirementForm.analystId ? Number(requirementForm.analystId) : null,
      };
      if (editingRequirementId) {
        await adminApi.updateRequirement(editingRequirementId, payload);
        setMessage("Требование обновлено");
      } else {
        await adminApi.createRequirement(payload);
        setMessage("Требование создано");
      }
      setEditingRequirementId(null);
      setRequirementForm(emptyRequirement);
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const editRequirement = (item) => {
    setEditingRequirementId(item.id);
    setRequirementForm({
      templateId: String(item.template_id),
      title: item.title,
      details: item.details || "",
      status: item.status || "draft",
      analystId: item.analyst_id ? String(item.analyst_id) : "",
    });
  };

  const removeRequirement = async (id) => {
    if (!window.confirm("Удалить требование?")) {
      return;
    }
    try {
      await adminApi.deleteRequirement(id);
      setMessage("Требование удалено");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const createRule = async (payload) => {
    await adminApi.createRule(payload);
    await loadData();
  };

  const updateRule = async (id, payload) => {
    await adminApi.updateRule(id, payload);
    await loadData();
  };

  const deleteRule = async (id) => {
    await adminApi.deleteRule(id);
    await loadData();
  };

  if (loading) {
    return <p>Загрузка админ-панели...</p>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1>Кабинет администратора</h1>
          <p>
            Пользователь: {user.name} ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Выйти</button>
      </header>

      {error ? <div style={styles.error}>{error}</div> : null}
      {message ? <div style={styles.message}>{message}</div> : null}

      <section style={styles.card}>
        <h3>{editingUserId ? "Редактировать пользователя" : "Новый пользователь"}</h3>
        <form onSubmit={submitUser} style={styles.formGrid}>
          <input
            required
            placeholder="Имя"
            value={userForm.name}
            onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={userForm.email}
            onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            type="password"
            placeholder={editingUserId ? "Новый пароль (опционально)" : "Пароль"}
            required={!editingUserId}
            value={userForm.password}
            onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <select
            value={userForm.role}
            onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value="аналитик">аналитик</option>
            <option value="админ">админ</option>
          </select>
          <button type="submit">{editingUserId ? "Сохранить" : "Создать"}</button>
          {editingUserId ? (
            <button
              type="button"
              onClick={() => {
                setEditingUserId(null);
                setUserForm(emptyUser);
              }}
            >
              Отмена
            </button>
          ) : null}
        </form>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>
                <td style={styles.row}>
                  <button type="button" onClick={() => editUser(item)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => removeUser(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={5}>Пользователей нет</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section style={styles.grid}>
        <TemplateForm
          onSubmit={editingTemplate ? updateTemplate : createTemplate}
          initialTemplate={editingTemplate}
          submitLabel={editingTemplate ? "Обновить шаблон" : "Создать шаблон"}
          onCancel={editingTemplate ? () => setEditingTemplate(null) : undefined}
        />
        <section style={styles.card}>
          <h3>Шаблоны</h3>
          <select
            style={styles.select}
            value={selectedTemplateId || ""}
            onChange={(event) => setSelectedTemplateId(Number(event.target.value))}
          >
            <option value="">Выберите шаблон</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                #{template.id} {template.name}
              </option>
            ))}
          </select>
          <ul style={styles.list}>
            {templates.map((template) => (
              <li key={template.id} style={styles.listItem}>
                <div>
                  <strong>{template.name}</strong>
                  <div style={styles.muted}>{template.description || "Без описания"}</div>
                </div>
                <div style={styles.row}>
                  <button type="button" onClick={() => setEditingTemplate(template)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => removeTemplate(template.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {!templates.length ? <li>Шаблонов нет</li> : null}
          </ul>
        </section>
        <SchemaViewer schema={selectedTemplate?.schema} />
      </section>

      <section style={styles.card}>
        <h3>{editingRequirementId ? "Редактировать требование" : "Новое требование"}</h3>
        <form onSubmit={submitRequirement} style={styles.formGrid}>
          <select
            required
            value={requirementForm.templateId}
            onChange={(event) =>
              setRequirementForm((prev) => ({ ...prev, templateId: event.target.value }))
            }
          >
            <option value="">Выберите шаблон</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                #{template.id} {template.name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Заголовок"
            value={requirementForm.title}
            onChange={(event) =>
              setRequirementForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <input
            placeholder="Подробности"
            value={requirementForm.details}
            onChange={(event) =>
              setRequirementForm((prev) => ({ ...prev, details: event.target.value }))
            }
          />
          <select
            value={requirementForm.status}
            onChange={(event) =>
              setRequirementForm((prev) => ({ ...prev, status: event.target.value }))
            }
          >
            <option value="draft">draft</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
          <input
            placeholder="ID аналитика (опционально)"
            value={requirementForm.analystId}
            onChange={(event) =>
              setRequirementForm((prev) => ({ ...prev, analystId: event.target.value }))
            }
          />
          <button type="submit">{editingRequirementId ? "Сохранить" : "Создать"}</button>
          {editingRequirementId ? (
            <button
              type="button"
              onClick={() => {
                setEditingRequirementId(null);
                setRequirementForm(emptyRequirement);
              }}
            >
              Отмена
            </button>
          ) : null}
        </form>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Template</th>
              <th>Title</th>
              <th>Status</th>
              <th>Analyst</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.template_id}</td>
                <td>{item.title}</td>
                <td>{item.status}</td>
                <td>{item.analyst_id ?? "-"}</td>
                <td style={styles.row}>
                  <button type="button" onClick={() => editRequirement(item)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => removeRequirement(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!requirements.length ? (
              <tr>
                <td colSpan={6}>Требований нет</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <RuleTable
        rules={rules}
        templates={templates}
        onCreate={createRule}
        onUpdate={updateRule}
        onDelete={deleteRule}
      />
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1260,
    margin: "0 auto",
    padding: 20,
    background: "#f4f6fb",
    minHeight: "100vh",
    display: "grid",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    background: "#fff",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    padding: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  row: { display: "flex", gap: 6 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    border: "1px solid #eee",
    borderRadius: 6,
    padding: 8,
  },
  select: { width: "100%", marginBottom: 10, padding: 8 },
  muted: { color: "#666", fontSize: 13 },
  error: {
    color: "#900",
    background: "#ffeaea",
    border: "1px solid #f0b1b1",
    borderRadius: 6,
    padding: 10,
  },
  message: {
    color: "#0b5",
    background: "#ebfff4",
    border: "1px solid #9ce2be",
    borderRadius: 6,
    padding: 10,
  },
};

export default AdminDashboard;
