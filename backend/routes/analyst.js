const express = require("express");
const analystController = require("../controllers/analystController");
const { authenticateToken, authorizeRoles } = require("../controllers/authController");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("аналитик", "админ"));

router.get("/templates", analystController.listTemplates);
router.post("/templates", analystController.createTemplate);
router.get("/templates/:id", analystController.getTemplate);
router.put("/templates/:id", analystController.updateTemplate);
router.delete("/templates/:id", analystController.deleteTemplate);

router.get("/requirements", analystController.listRequirements);
router.post("/requirements", analystController.createRequirement);
router.get("/requirements/:id", analystController.getRequirement);
router.put("/requirements/:id", analystController.updateRequirement);
router.delete("/requirements/:id", analystController.deleteRequirement);

router.get("/rules", analystController.listRules);
router.post("/rules", analystController.createRule);
router.get("/rules/:id", analystController.getRule);
router.put("/rules/:id", analystController.updateRule);
router.delete("/rules/:id", analystController.deleteRule);

module.exports = router;
