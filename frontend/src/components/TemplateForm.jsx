import { useEffect, useMemo, useState } from "react";

/**
 * Компонент формы для сущности "Система" (template).
 * Использование:
 *  - create: <TemplateForm onSubmit={createFn} />
 *  - edit:   <TemplateForm initialTemplate={item} onSubmit={updateFn} onCancel={...} />
 * На выход отдаёт payload в формате backend: { name, description, schema }.
 */
const emptyTemplate = {
  name: "",
  description: "",
  schema: "",
};

function buildDefaultSchema(name, description) {
  const safeName = name?.trim() || "System";
  const safeDescription = description?.trim() || "Основной поток";
  return `flowchart TD
  Start([${safeName}]) --> Scope["${safeDescription}"]
  Scope --> Actor[Пользователь]
  Scope --> Validation{Проверка правил}
  Validation -->|ok| Done([Готово])
  Validation -->|fail| Retry([Доработка])`;
}

function TemplateForm({
  onSubmit,
  initialTemplate = null,
  submitLabel = "Сохранить систему",
  onCancel,
}) {
  const [form, setForm] = useState(emptyTemplate);
  const [useManualSchema, setUseManualSchema] = useState(false);

  useEffect(() => {
    if (initialTemplate) {
      setForm({
        name: initialTemplate.name || "",
        description: initialTemplate.description || "",
        schema: initialTemplate.schema || "",
      });
      setUseManualSchema(Boolean(initialTemplate.schema));
      return;
    }
    setForm(emptyTemplate);
    setUseManualSchema(false);
  }, [initialTemplate]);

  const generatedSchema = useMemo(
    () => buildDefaultSchema(form.name, form.description),
    [form.name, form.description]
  );

  const schemaPreview = useManualSchema ? form.schema : generatedSchema;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      schema: (schemaPreview || "").trim(),
    };

    await onSubmit(payload);
    if (!initialTemplate) {
      setForm(emptyTemplate);
      setUseManualSchema(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.title}>{initialTemplate ? "Редактировать систему" : "Добавить систему"}</h3>

      <label style={styles.label}>
        Название системы
        <input
          style={styles.input}
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Например: Billing Core"
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
          placeholder="Коротко опишите назначение системы"
        />
      </label>

      <label style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={useManualSchema}
          onChange={(event) => setUseManualSchema(event.target.checked)}
        />
        Редактировать Mermaid-схему вручную
      </label>

      {useManualSchema ? (
        <label style={styles.label}>
          Mermaid-схема
          <textarea
            style={styles.textarea}
            name="schema"
            value={form.schema}
            onChange={handleChange}
            rows={8}
            placeholder="flowchart TD ..."
          />
        </label>
      ) : (
        <div style={styles.previewBox}>
          <strong>Автосхема:</strong>
          <pre style={styles.preview}>{generatedSchema}</pre>
        </div>
      )}

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
    border: "1px solid #dde2f2",
    borderRadius: 12,
    background: "#fff",
  },
  title: { margin: 0 },
  label: { display: "grid", gap: 6, fontWeight: 600 },
  input: { padding: 10, borderRadius: 8, border: "1px solid #c6cde5" },
  textarea: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #c6cde5",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
  },
  previewBox: {
    border: "1px dashed #c6cde5",
    borderRadius: 8,
    padding: 10,
    background: "#f7f9ff",
  },
  preview: {
    margin: "8px 0 0",
    whiteSpace: "pre-wrap",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12,
  },
  actions: { display: "flex", gap: 8 },
};

export default TemplateForm;
