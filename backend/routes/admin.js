const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../controllers/authController");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("админ"));

router.get("/users", adminController.listUsers);
router.post("/users", adminController.createUser);
router.get("/users/:id", adminController.getUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

router.get("/templates", adminController.listTemplates);
router.post("/templates", adminController.createTemplate);
router.get("/templates/:id", adminController.getTemplate);
router.put("/templates/:id", adminController.updateTemplate);
router.delete("/templates/:id", adminController.deleteTemplate);

router.get("/requirements", adminController.listRequirements);
router.post("/requirements", adminController.createRequirement);
router.get("/requirements/:id", adminController.getRequirement);
router.put("/requirements/:id", adminController.updateRequirement);
router.delete("/requirements/:id", adminController.deleteRequirement);

router.get("/rules", adminController.listRules);
router.post("/rules", adminController.createRule);
router.get("/rules/:id", adminController.getRule);
router.put("/rules/:id", adminController.updateRule);
router.delete("/rules/:id", adminController.deleteRule);

module.exports = router;
