import { useEffect, useMemo, useState } from "react";
import { analystApi } from "../api/api";
import TemplateForm from "../components/TemplateForm";
import RuleTable from "../components/RuleTable";
import SchemaViewer from "../components/SchemaViewer";

const emptyRequirement = {
  templateId: "",
  title: "",
  details: "",
  status: "draft",
};

function AnalystDashboard({ user, onLogout }) {
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [requirementForm, setRequirementForm] = useState(emptyRequirement);
  const [editingRequirementId, setEditingRequirementId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const filteredRequirements = useMemo(() => {
    if (!selectedTemplateId) {
      return requirements;
    }
    return requirements.filter((item) => item.template_id === selectedTemplateId);
  }, [requirements, selectedTemplateId]);

  const filteredRules = useMemo(() => {
    if (!selectedTemplateId) {
      return rules;
    }
    return rules.filter((item) => item.template_id === selectedTemplateId);
  }, [rules, selectedTemplateId]);

  const parseError = (apiError) =>
    apiError?.response?.data?.message || apiError.message || "Неизвестная ошибка";

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesResponse, requirementsResponse, rulesResponse] = await Promise.all([
        analystApi.listTemplates(),
        analystApi.listRequirements(),
        analystApi.listRules(),
      ]);

      const loadedTemplates = templatesResponse.data;
      setTemplates(loadedTemplates);
      setRequirements(requirementsResponse.data);
      setRules(rulesResponse.data);

      if (loadedTemplates.length && !selectedTemplateId) {
        const firstTemplateId = loadedTemplates[0].id;
        setSelectedTemplateId(firstTemplateId);
        setRequirementForm((prev) => ({ ...prev, templateId: String(firstTemplateId) }));
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

  const handleCreateTemplate = async (payload) => {
    try {
      await analystApi.createTemplate(payload);
      setMessage("Шаблон создан");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const handleUpdateTemplate = async (payload) => {
    if (!editingTemplate) {
      return;
    }
    try {
      await analystApi.updateTemplate(editingTemplate.id, payload);
      setEditingTemplate(null);
      setMessage("Шаблон обновлен");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Удалить шаблон?")) {
      return;
    }
    try {
      await analystApi.deleteTemplate(id);
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
      }
      setMessage("Шаблон удален");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const submitRequirement = async (event) => {
    event.preventDefault();
    try {
      if (editingRequirementId) {
        await analystApi.updateRequirement(editingRequirementId, {
          ...requirementForm,
          templateId: Number(requirementForm.templateId),
        });
        setMessage("Требование обновлено");
      } else {
        await analystApi.createRequirement({
          ...requirementForm,
          templateId: Number(requirementForm.templateId),
        });
        setMessage("Требование создано");
      }
      setRequirementForm((prev) => ({
        ...emptyRequirement,
        templateId: prev.templateId || (selectedTemplateId ? String(selectedTemplateId) : ""),
      }));
      setEditingRequirementId(null);
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const editRequirement = (requirement) => {
    setEditingRequirementId(requirement.id);
    setRequirementForm({
      templateId: String(requirement.template_id),
      title: requirement.title,
      details: requirement.details || "",
      status: requirement.status || "draft",
    });
  };

  const removeRequirement = async (id) => {
    if (!window.confirm("Удалить требование?")) {
      return;
    }
    try {
      await analystApi.deleteRequirement(id);
      setMessage("Требование удалено");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const createRule = async (payload) => {
    await analystApi.createRule(payload);
    await loadData();
  };

  const updateRule = async (id, payload) => {
    await analystApi.updateRule(id, payload);
    await loadData();
  };

  const deleteRule = async (id) => {
    await analystApi.deleteRule(id);
    await loadData();
  };

  if (loading) {
    return <p>Загрузка кабинета аналитика...</p>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1>Кабинет аналитика</h1>
          <p>
            Пользователь: {user.name} ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Выйти</button>
      </header>

      {error ? <div style={styles.error}>{error}</div> : null}
      {message ? <div style={styles.message}>{message}</div> : null}

      <section style={styles.grid}>
        <TemplateForm
          onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          initialTemplate={editingTemplate}
          submitLabel={editingTemplate ? "Обновить шаблон" : "Создать шаблон"}
          onCancel={editingTemplate ? () => setEditingTemplate(null) : undefined}
        />

        <section style={styles.card}>
          <h3>Список шаблонов</h3>
          <select
            style={styles.select}
            value={selectedTemplateId || ""}
            onChange={(event) => setSelectedTemplateId(Number(event.target.value))}
          >
            <option value="">Выберите шаблон для просмотра</option>
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
                    Редактировать
                  </button>
                  <button type="button" onClick={() => handleDeleteTemplate(template.id)}>
                    Удалить
                  </button>
                </div>
              </li>
            ))}
            {!templates.length ? <li>Шаблонов пока нет</li> : null}
          </ul>
        </section>

        <SchemaViewer schema={selectedTemplate?.schema} />
      </section>

      <section style={styles.card}>
        <h3>{editingRequirementId ? "Редактирование требования" : "Новое требование"}</h3>
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
            placeholder="Заголовок требования"
            value={requirementForm.title}
            onChange={(event) => setRequirementForm((prev) => ({ ...prev, title: event.target.value }))}
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
            onChange={(event) => setRequirementForm((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="draft">draft</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
          <button type="submit">
            {editingRequirementId ? "Сохранить требование" : "Добавить требование"}
          </button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequirements.map((requirement) => (
              <tr key={requirement.id}>
                <td>{requirement.id}</td>
                <td>{requirement.template_id}</td>
                <td>{requirement.title}</td>
                <td>{requirement.status}</td>
                <td style={styles.row}>
                  <button type="button" onClick={() => editRequirement(requirement)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => removeRequirement(requirement.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!filteredRequirements.length ? (
              <tr>
                <td colSpan={5}>Требований нет</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <RuleTable
        rules={filteredRules}
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
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    display: "grid",
    gap: 16,
    background: "#f5f7fb",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    borderRadius: 8,
    padding: "12px 16px",
    border: "1px solid #ddd",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    background: "#fff",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  list: {
    listStyle: "none",
    padding: 0,
    display: "grid",
    gap: 8,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    border: "1px solid #eee",
    borderRadius: 6,
    padding: 8,
  },
  row: { display: "flex", gap: 6 },
  select: { width: "100%", marginBottom: 10, padding: 8 },
  table: { width: "100%", borderCollapse: "collapse" },
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

export default AnalystDashboard;
