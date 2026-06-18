import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import rankingsRouter from "./rankings";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobsRouter);
router.use(candidatesRouter);
router.use(rankingsRouter);
router.use(statsRouter);

export default router;
