import { useMemo, useState } from "react";

/**
 * Таблица и форма правил.
 * Важное:
 *  - для backend правило сохраняется как { templateId, analystId, name, conditionText, actionText, priority }.
 *  - dropdown "Система" и "Роль" используются и в create, и в edit.
 */
const emptyRule = {
  templateId: "",
  roleId: "",
  name: "",
  conditionText: "",
  actionText: "",
  priority: 1,
};

const fallbackRoles = [
  { id: "аналитик", label: "Аналитик" },
  { id: "админ", label: "Админ" },
];

function toRoleOption(item) {
  if (!item) {
    return null;
  }
  if (typeof item === "string") {
    return { id: item, label: item };
  }
  const labelParts = [item.name || "Без имени", item.role || "роль"];
  return {
    id: String(item.id),
    label: `${labelParts.join(" / ")}${item.email ? ` (${item.email})` : ""}`,
  };
}

function RuleTable({ rules, templates, roleOptions = [], onCreate, onUpdate, onDelete }) {
  const [newRule, setNewRule] = useState(emptyRule);
  const [editingId, setEditingId] = useState(null);
  const [editingRule, setEditingRule] = useState(emptyRule);
  const [busy, setBusy] = useState(false);

  const templateOptions = useMemo(() => templates || [], [templates]);
  const normalizedRoles = useMemo(() => {
    const prepared = roleOptions.map(toRoleOption).filter(Boolean);
    return prepared.length ? prepared : fallbackRoles;
  }, [roleOptions]);

  const roleLabelById = useMemo(() => {
    const map = {};
    normalizedRoles.forEach((role) => {
      map[String(role.id)] = role.label;
    });
    return map;
  }, [normalizedRoles]);

  const templateLabelById = useMemo(() => {
    const map = {};
    templateOptions.forEach((template) => {
      map[String(template.id)] = template.name;
    });
    return map;
  }, [templateOptions]);

  const composeRulePayload = (formState) => {
    const systemName = templateLabelById[String(formState.templateId)] || "Система";
    const roleName = roleLabelById[String(formState.roleId)] || "Роль";
    const numericRoleId = Number(formState.roleId);

    return {
      templateId: Number(formState.templateId),
      analystId: Number.isFinite(numericRoleId) ? numericRoleId : undefined,
      name: formState.name.trim() || `${systemName} / ${roleName}`,
      conditionText: formState.conditionText.trim(),
      actionText: formState.actionText.trim(),
      priority: Number(formState.priority || 1),
    };
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onCreate(composeRulePayload(newRule));
      setNewRule(emptyRule);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditingRule({
      templateId: String(rule.template_id || ""),
      roleId: String(rule.analyst_id || ""),
      name: rule.name || "",
      conditionText: rule.condition_text || "",
      actionText: rule.action_text || "",
      priority: rule.priority || 1,
    });
  };

  const saveEdit = async (id) => {
    setBusy(true);
    try {
      await onUpdate(id, composeRulePayload(editingRule));
      setEditingId(null);
      setEditingRule(emptyRule);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={styles.section}>
      <h3 style={styles.title}>Правила</h3>

      <form onSubmit={handleCreate} style={styles.form}>
        <select
          required
          value={newRule.templateId}
          onChange={(event) => setNewRule((prev) => ({ ...prev, templateId: event.target.value }))}
        >
          <option value="">Система</option>
          {templateOptions.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>

        <select
          required
          value={newRule.roleId}
          onChange={(event) => setNewRule((prev) => ({ ...prev, roleId: event.target.value }))}
        >
          <option value="">Роль</option>
          {normalizedRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>

        <input
          placeholder="Название правила (необязательно)"
          value={newRule.name}
          onChange={(event) => setNewRule((prev) => ({ ...prev, name: event.target.value }))}
        />

        <input
          required
          placeholder="Условие срабатывания"
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

        <button type="submit" disabled={busy || !templateOptions.length}>
          Добавить
        </button>
      </form>

      {!templateOptions.length ? (
        <div style={styles.emptyHint}>Сначала создайте хотя бы одну систему.</div>
      ) : null}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Система</th>
            <th>Роль</th>
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
                      <option value="">Система</option>
                      {templateOptions.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    templateLabelById[String(rule.template_id)] || `#${rule.template_id}`
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      value={editingRule.roleId}
                      onChange={(event) =>
                        setEditingRule((prev) => ({ ...prev, roleId: event.target.value }))
                      }
                    >
                      <option value="">Роль</option>
                      {normalizedRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    roleLabelById[String(rule.analyst_id)] || "Не назначена"
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
                <td style={styles.rowActions}>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(rule.id)} disabled={busy}>
                        Сохранить
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} disabled={busy}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(rule)} disabled={busy}>
                        Редактировать
                      </button>
                      <button type="button" onClick={() => onDelete(rule.id)} disabled={busy}>
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
              <td colSpan={8}>Список правил пуст</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

const styles = {
  section: {
    border: "1px solid #dde2f2",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  title: { marginTop: 0 },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  emptyHint: {
    marginBottom: 12,
    background: "#fff8e6",
    border: "1px solid #ffe1a1",
    padding: 10,
    borderRadius: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  rowActions: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
};

export default RuleTable;
