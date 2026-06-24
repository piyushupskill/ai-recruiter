import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import applicationsRouter from "./applications";
import pipelineRouter from "./pipeline";
import toolsRouter from "./tools";
import bulkRouter from "./bulk";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bulkRouter);
router.use(jobsRouter);
router.use(candidatesRouter);
router.use(applicationsRouter);
router.use(pipelineRouter);
router.use(toolsRouter);

export default router;
