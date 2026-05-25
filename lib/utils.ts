import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Сливане на Tailwind класове (ShadCN / CVA). */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
