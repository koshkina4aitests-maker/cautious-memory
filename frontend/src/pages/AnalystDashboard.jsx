import { useEffect, useMemo, useState } from "react";
import { analystApi } from "../api/api";
import SchemaViewer from "../components/SchemaViewer";

/**
 * Личный кабинет аналитика.
 * Логика страницы:
 *  1) пошаговый ввод требований (проект -> функционал -> системы/роли),
 *  2) автогенерация схемы по введённым данным,
 *  3) сохранение результата в backend через JWT (template + requirements + rules).
 */
const wizardSteps = [
  "Название проекта",
  "Функционал",
  "Системы и роли",
];

const roleCatalog = ["аналитик", "админ", "архитектор", "тестировщик", "оператор"];

const initialWizardState = {
  projectName: "",
  projectDescription: "",
  functionalities: [""],
  systemMode: "existing",
  existingSystemId: "",
  newSystemName: "",
  selectedRoles: ["аналитик"],
  customRole: "",
};

function toMermaid(graph) {
  if (!graph?.nodes?.length) {
    return "";
  }
  const lines = ["flowchart TD"];
  graph.nodes.forEach((node) => {
    lines.push(`  ${node.id}["${node.label.replace(/"/g, "'")}"]`);
  });
  graph.edges.forEach((edge) => {
    lines.push(`  ${edge.from} --> ${edge.to}`);
  });
  return lines.join("\n");
}

function buildGraphModel(wizard, templates) {
  const cleanFunctionalities = wizard.functionalities.map((item) => item.trim()).filter(Boolean);
  const selectedSystemName =
    wizard.systemMode === "existing"
      ? templates.find((item) => String(item.id) === wizard.existingSystemId)?.name || "Система"
      : wizard.newSystemName.trim() || "Новая система";

  const projectLabel = wizard.projectName.trim() || "Проект";
  const roleNodes = wizard.selectedRoles.length ? wizard.selectedRoles : ["аналитик"];

  const nodes = [
    { id: "project", label: projectLabel, x: 30, y: 40, color: "#dce7ff" },
    { id: "system", label: selectedSystemName, x: 280, y: 40, color: "#eaf7ff" },
  ];
  const edges = [{ id: "edge-project-system", from: "project", to: "system" }];

  cleanFunctionalities.forEach((item, index) => {
    const nodeId = `func_${index}`;
    nodes.push({
      id: nodeId,
      label: item,
      x: 30 + index * 180,
      y: 190,
      color: "#f2f6ff",
    });
    edges.push({ id: `edge-system-${nodeId}`, from: "system", to: nodeId });
  });

  roleNodes.forEach((role, index) => {
    const nodeId = `role_${index}`;
    nodes.push({
      id: nodeId,
      label: role,
      x: 280 + index * 170,
      y: 320,
      color: "#fff4ea",
    });
    cleanFunctionalities.forEach((_, funcIndex) => {
      edges.push({
        id: `edge-func-role-${funcIndex}-${index}`,
        from: `func_${funcIndex}`,
        to: nodeId,
      });
    });
  });

  return { nodes, edges };
}

function AnalystDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0);

  const [templates, setTemplates] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [rules, setRules] = useState([]);

  const [wizard, setWizard] = useState(initialWizardState);

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
      const nextTemplates = templatesResponse.data || [];
      setTemplates(nextTemplates);
      setRequirements(requirementsResponse.data || []);
      setRules(rulesResponse.data || []);

      setWizard((prev) => ({
        ...prev,
        existingSystemId:
          prev.existingSystemId || (nextTemplates[0] ? String(nextTemplates[0].id) : ""),
      }));
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

  const graphModel = useMemo(() => buildGraphModel(wizard, templates), [wizard, templates]);

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2200);
  };

  const updateFunctionality = (index, value) => {
    setWizard((prev) => {
      const next = [...prev.functionalities];
      next[index] = value;
      return { ...prev, functionalities: next };
    });
  };

  const addFunctionality = () => {
    setWizard((prev) => ({ ...prev, functionalities: [...prev.functionalities, ""] }));
  };

  const removeFunctionality = (index) => {
    setWizard((prev) => {
      const next = prev.functionalities.filter((_, i) => i !== index);
      return { ...prev, functionalities: next.length ? next : [""] };
    });
  };

  const toggleRole = (role) => {
    setWizard((prev) => {
      const isSelected = prev.selectedRoles.includes(role);
      return {
        ...prev,
        selectedRoles: isSelected
          ? prev.selectedRoles.filter((item) => item !== role)
          : [...prev.selectedRoles, role],
      };
    });
  };

  const addCustomRole = () => {
    const normalized = wizard.customRole.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    if (!wizard.selectedRoles.includes(normalized)) {
      setWizard((prev) => ({
        ...prev,
        selectedRoles: [...prev.selectedRoles, normalized],
        customRole: "",
      }));
    } else {
      setWizard((prev) => ({ ...prev, customRole: "" }));
    }
  };

  const canGoNext =
    (step === 0 && wizard.projectName.trim()) ||
    (step === 1 && wizard.functionalities.some((item) => item.trim())) ||
    (step === 2 &&
      (wizard.systemMode === "existing" ? wizard.existingSystemId : wizard.newSystemName.trim()));

  const createRequirementsPackage = async () => {
    const cleanFunctionalities = wizard.functionalities.map((item) => item.trim()).filter(Boolean);
    if (!wizard.projectName.trim() || !cleanFunctionalities.length) {
      setError("Укажите проект и хотя бы одну функцию");
      return;
    }

    const selectedRoles = wizard.selectedRoles.length ? wizard.selectedRoles : ["аналитик"];

    let systemId;
    if (wizard.systemMode === "existing") {
      systemId = Number(wizard.existingSystemId);
    } else {
      const createdSystem = await analystApi.createTemplate({
        name: wizard.newSystemName.trim(),
        description: wizard.projectDescription.trim(),
        schema: toMermaid(graphModel),
      });
      systemId = createdSystem.data.id;
    }

    // Сохраняем требования по каждой функции.
    for (const functionality of cleanFunctionalities) {
      await analystApi.createRequirement({
        templateId: systemId,
        title: `${wizard.projectName.trim()}: ${functionality}`,
        details: `${wizard.projectDescription.trim()}\nРоли: ${selectedRoles.join(", ")}`,
        status: "draft",
      });
    }

    // Сохраняем правила для выбранных ролей.
    for (const [index, roleName] of selectedRoles.entries()) {
      await analystApi.createRule({
        templateId: systemId,
        name: `${wizard.projectName.trim()} / ${roleName}`,
        conditionText: `Функции: ${cleanFunctionalities.join(", ")}`,
        actionText: `Роль ${roleName} обрабатывает сценарии проекта`,
        priority: Math.max(1, selectedRoles.length - index),
      });
    }
  };

  const saveWizard = async () => {
    try {
      await createRequirementsPackage();
      notify("Требования, система и правила сохранены");
      setStep(0);
      setWizard((prev) => ({
        ...initialWizardState,
        existingSystemId: prev.existingSystemId || "",
      }));
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Загрузка кабинета аналитика...</p>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Личный кабинет: Аналитик</h1>
          <p style={styles.subtitle}>
            Пользователь: {user.name} ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Выйти</button>
      </header>

      {error ? <div style={styles.error}>{error}</div> : null}
      {message ? <div style={styles.message}>{message}</div> : null}

      <section style={styles.card}>
        <h3>Пошаговый ввод требований</h3>
        <div style={styles.stepRow}>
          {wizardSteps.map((name, index) => (
            <div
              key={name}
              style={{
                ...styles.stepBadge,
                ...(index === step ? styles.stepBadgeActive : {}),
              }}
            >
              {index + 1}. {name}
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div style={styles.formGrid}>
            <input
              placeholder="Название проекта"
              value={wizard.projectName}
              onChange={(event) =>
                setWizard((prev) => ({ ...prev, projectName: event.target.value }))
              }
            />
            <textarea
              rows={4}
              placeholder="Краткое описание проекта"
              value={wizard.projectDescription}
              onChange={(event) =>
                setWizard((prev) => ({ ...prev, projectDescription: event.target.value }))
              }
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div style={styles.cardInner}>
            {wizard.functionalities.map((item, index) => (
              <div key={`func-${index}`} style={styles.functionRow}>
                <input
                  placeholder={`Функция #${index + 1}`}
                  value={item}
                  onChange={(event) => updateFunctionality(index, event.target.value)}
                />
                <button type="button" onClick={() => removeFunctionality(index)}>
                  Удалить
                </button>
              </div>
            ))}
            <button type="button" onClick={addFunctionality}>
              + Добавить функционал
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div style={styles.cardInner}>
            <div style={styles.inlineGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={wizard.systemMode === "existing"}
                  onChange={() => setWizard((prev) => ({ ...prev, systemMode: "existing" }))}
                />
                Выбрать существующую систему
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={wizard.systemMode === "new"}
                  onChange={() => setWizard((prev) => ({ ...prev, systemMode: "new" }))}
                />
                Создать новую систему
              </label>
            </div>

            {wizard.systemMode === "existing" ? (
              <select
                value={wizard.existingSystemId}
                onChange={(event) =>
                  setWizard((prev) => ({ ...prev, existingSystemId: event.target.value }))
                }
              >
                <option value="">Выберите систему</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Название новой системы"
                value={wizard.newSystemName}
                onChange={(event) =>
                  setWizard((prev) => ({ ...prev, newSystemName: event.target.value }))
                }
              />
            )}

            <div style={styles.rolesBox}>
              <strong>Выберите роли</strong>
              <div style={styles.roleGrid}>
                {roleCatalog.map((role) => (
                  <label key={role} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={wizard.selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.inlineGroup}>
              <input
                placeholder="Добавить свою роль"
                value={wizard.customRole}
                onChange={(event) => setWizard((prev) => ({ ...prev, customRole: event.target.value }))}
              />
              <button type="button" onClick={addCustomRole}>
                Добавить роль
              </button>
            </div>
          </div>
        ) : null}

        <div style={styles.navButtons}>
          <button type="button" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0}>
            Назад
          </button>
          {step < wizardSteps.length - 1 ? (
            <button type="button" disabled={!canGoNext} onClick={() => setStep((prev) => prev + 1)}>
              Далее
            </button>
          ) : (
            <button type="button" disabled={!canGoNext} onClick={saveWizard}>
              Сохранить требования
            </button>
          )}
        </div>
      </section>

      <SchemaViewer
        title="Автоматически сгенерированная схема требований"
        graph={graphModel}
        onGraphChange={() => {}}
      />

      <section style={styles.grid}>
        <section style={styles.card}>
          <h3>Последние требования</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Система</th>
                <th>Требование</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {requirements.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.template_id}</td>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
              {!requirements.length ? (
                <tr>
                  <td colSpan={4}>Список пуст</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section style={styles.card}>
          <h3>Последние правила</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Система</th>
                <th>Название</th>
                <th>Приоритет</th>
              </tr>
            </thead>
            <tbody>
              {rules.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.template_id}</td>
                  <td>{item.name}</td>
                  <td>{item.priority}</td>
                </tr>
              ))}
              {!rules.length ? (
                <tr>
                  <td colSpan={4}>Список пуст</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 20,
    background: "#f4f7ff",
    minHeight: "100vh",
    display: "grid",
    gap: 14,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #dde2f2",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  title: { margin: 0 },
  subtitle: { margin: "4px 0 0", color: "#4d5a82" },
  card: {
    border: "1px solid #dde2f2",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    display: "grid",
    gap: 12,
  },
  cardInner: { display: "grid", gap: 10 },
  stepRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  stepBadge: {
    border: "1px solid #cad2ee",
    borderRadius: 999,
    padding: "6px 10px",
    color: "#4d5a82",
  },
  stepBadgeActive: {
    borderColor: "#1f4fff",
    background: "#edf2ff",
    color: "#1f4fff",
    fontWeight: 600,
  },
  formGrid: { display: "grid", gap: 10 },
  functionRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
  },
  inlineGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  radioLabel: { display: "flex", alignItems: "center", gap: 6 },
  rolesBox: {
    border: "1px solid #e6ebfb",
    borderRadius: 10,
    padding: 10,
    display: "grid",
    gap: 8,
  },
  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 6,
  },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 6 },
  navButtons: { display: "flex", gap: 8, justifyContent: "flex-end" },
  grid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1fr 1fr",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  error: {
    color: "#900",
    background: "#ffeaea",
    border: "1px solid #f0b1b1",
    borderRadius: 8,
    padding: 10,
  },
  message: {
    color: "#0b5",
    background: "#ebfff4",
    border: "1px solid #9ce2be",
    borderRadius: 8,
    padding: 10,
  },
};

export default AnalystDashboard;
