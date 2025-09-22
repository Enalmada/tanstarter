import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { isValid } from "date-fns/isValid";

export const formatDate = (value: string | number | Date | null): string | null => {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	if (!isValid(date)) return null;
	return formatDistanceToNow(date, { addSuffix: true });
};
