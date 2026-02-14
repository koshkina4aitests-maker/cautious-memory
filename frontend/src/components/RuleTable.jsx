import { useMemo, useState } from "react";

const emptyRule = {
  templateId: "",
  name: "",
  conditionText: "",
  actionText: "",
  priority: 1,
};

function RuleTable({ rules, templates, onCreate, onUpdate, onDelete }) {
  const [newRule, setNewRule] = useState(emptyRule);
  const [editingId, setEditingId] = useState(null);
  const [editingRule, setEditingRule] = useState(emptyRule);

  const templateOptions = useMemo(() => templates || [], [templates]);

  const handleCreate = async (event) => {
    event.preventDefault();
    await onCreate({
      ...newRule,
      templateId: Number(newRule.templateId),
      priority: Number(newRule.priority || 1),
    });
    setNewRule(emptyRule);
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditingRule({
      templateId: String(rule.template_id),
      name: rule.name,
      conditionText: rule.condition_text,
      actionText: rule.action_text,
      priority: rule.priority,
    });
  };

  const saveEdit = async (id) => {
    await onUpdate(id, {
      ...editingRule,
      templateId: Number(editingRule.templateId),
      priority: Number(editingRule.priority || 1),
    });
    setEditingId(null);
    setEditingRule(emptyRule);
  };

  return (
    <section style={styles.section}>
      <h3>Правила</h3>

      <form onSubmit={handleCreate} style={styles.form}>
        <select
          required
          value={newRule.templateId}
          onChange={(event) => setNewRule((prev) => ({ ...prev, templateId: event.target.value }))}
        >
          <option value="">Выберите шаблон</option>
          {templateOptions.map((template) => (
            <option key={template.id} value={template.id}>
              #{template.id} {template.name}
            </option>
          ))}
        </select>

        <input
          required
          placeholder="Название правила"
          value={newRule.name}
          onChange={(event) => setNewRule((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          required
          placeholder="Условие"
          value={newRule.conditionText}
          onChange={(event) =>
            setNewRule((prev) => ({ ...prev, conditionText: event.target.value }))
          }
        />
        <input
          required
          placeholder="Действие"
          value={newRule.actionText}
          onChange={(event) => setNewRule((prev) => ({ ...prev, actionText: event.target.value }))}
        />
        <input
          type="number"
          min={1}
          value={newRule.priority}
          onChange={(event) => setNewRule((prev) => ({ ...prev, priority: event.target.value }))}
        />
        <button type="submit">Добавить правило</button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Шаблон</th>
            <th>Название</th>
            <th>Условие</th>
            <th>Действие</th>
            <th>Приоритет</th>
            <th>Управление</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const isEditing = editingId === rule.id;
            return (
              <tr key={rule.id}>
                <td>{rule.id}</td>
                <td>
                  {isEditing ? (
                    <select
                      value={editingRule.templateId}
                      onChange={(event) =>
                        setEditingRule((prev) => ({ ...prev, templateId: event.target.value }))
                      }
                    >
                      {templateOptions.map((template) => (
                        <option key={template.id} value={template.id}>
                          #{template.id} {template.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    rule.template_id
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editingRule.name}
                      onChange={(event) =>
                        setEditingRule((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  ) : (
                    rule.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editingRule.conditionText}
                      onChange={(event) =>
                        setEditingRule((prev) => ({ ...prev, conditionText: event.target.value }))
                      }
                    />
                  ) : (
                    rule.condition_text
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editingRule.actionText}
                      onChange={(event) =>
                        setEditingRule((prev) => ({ ...prev, actionText: event.target.value }))
                      }
                    />
                  ) : (
                    rule.action_text
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      value={editingRule.priority}
                      onChange={(event) =>
                        setEditingRule((prev) => ({ ...prev, priority: event.target.value }))
                      }
                    />
                  ) : (
                    rule.priority
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(rule.id)}>
                        Сохранить
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(rule)}>
                        Редактировать
                      </button>
                      <button type="button" onClick={() => onDelete(rule.id)}>
                        Удалить
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {!rules.length ? (
            <tr>
              <td colSpan={7}>Пока нет правил</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

const styles = {
  section: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    background: "#fff",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};

export default RuleTable;
