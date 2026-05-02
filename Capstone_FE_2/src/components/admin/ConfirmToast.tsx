import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface ConfirmToastProps {
    t: any;
    title: string;
    onConfirm: () => void;
    message?: string;
}

export const ConfirmToast = ({ t, title, message, onConfirm }: ConfirmToastProps) => (
    <div className="flex flex-col gap-3 p-1">
        <div>
            <p className="font-semibold text-sm text-white">{title}</p>
            {message && <p className="text-xs text-slate-400 mt-1">{message}</p>}
        </div>
        <div className="flex justify-end gap-2">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => toast.dismiss(t.id)}
            >
                Hủy
            </Button>
            <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs bg-red-600 hover:bg-red-700"
                onClick={() => {
                    toast.dismiss(t.id);
                    onConfirm();
                }}
            >
                Đồng ý
            </Button>
        </div>
    </div>
);