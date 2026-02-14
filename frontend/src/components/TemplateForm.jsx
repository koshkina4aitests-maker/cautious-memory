import { useEffect, useState } from "react";

const emptyTemplate = {
  name: "",
  description: "",
  schema: `flowchart TD
  Start[Start] --> Validate{Validate data}
  Validate -->|ok| Save[Save template]
  Validate -->|fail| Error[Show error]`,
};

function TemplateForm({
  onSubmit,
  initialTemplate = null,
  submitLabel = "Сохранить шаблон",
  onCancel,
}) {
  const [form, setForm] = useState(emptyTemplate);

  useEffect(() => {
    if (initialTemplate) {
      setForm({
        name: initialTemplate.name || "",
        description: initialTemplate.description || "",
        schema: initialTemplate.schema || "",
      });
    } else {
      setForm(emptyTemplate);
    }
  }, [initialTemplate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    if (!initialTemplate) {
      setForm(emptyTemplate);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3>{initialTemplate ? "Редактирование шаблона" : "Новый шаблон"}</h3>

      <label style={styles.label}>
        Название
        <input
          style={styles.input}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </label>

      <label style={styles.label}>
        Описание
        <textarea
          style={styles.textarea}
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <label style={styles.label}>
        Mermaid-схема
        <textarea
          style={styles.textarea}
          name="schema"
          value={form.schema}
          onChange={handleChange}
          rows={8}
        />
      </label>

      <div style={styles.actions}>
        <button type="submit">{submitLabel}</button>
        {onCancel ? (
          <button type="button" onClick={onCancel}>
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: 12,
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
  },
  label: { display: "grid", gap: 6, fontWeight: 600 },
  input: { padding: 8, borderRadius: 6, border: "1px solid #ccc" },
  textarea: { padding: 8, borderRadius: 6, border: "1px solid #ccc", fontFamily: "monospace" },
  actions: { display: "flex", gap: 8 },
};

export default TemplateForm;
