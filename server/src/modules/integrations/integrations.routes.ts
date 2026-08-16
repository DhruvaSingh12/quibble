import { Router } from "express";
import * as integrationsController from "./integrations.controller";
import { authenticate } from "../../middleware/authenticate";

export const integrationsRouter = Router();

integrationsRouter.use(authenticate);

integrationsRouter.get("/link-preview", integrationsController.getLinkPreview);

