import type { Request, Response, NextFunction } from "express";

export default function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error("[500 INTERNAL SERVER ERROR]", err);
	res.status(500).json({ error: "ERR_500_INTERNAL_ERROR" });
}
