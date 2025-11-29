import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function TestCredentialsPopup() {
    const [isVisible, setIsVisible] = useState(true);
    const [copiedField, setCopiedField] = useState(null);

    const credentials = [
        {
            role: 'Admin',
            email: 'admin@kubik.gr',
            password: 'admin'
        },
        {
            role: 'User',
            email: 'customer@kubik.gr',
            password: 'customer'
        }
    ];

    const handleCopy = (text, fieldId) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Test Credentials
                </h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {credentials.map((cred, index) => (
                    <div key={index} className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {cred.role} Account
                        </div>
                        <div className="bg-slate-50 rounded p-2 space-y-2 border border-slate-100">
                            <div className="flex items-center justify-between group">
                                <span className="text-sm text-slate-600 font-mono">{cred.email}</span>
                                <button
                                    onClick={() => handleCopy(cred.email, `email-${index}`)}
                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Copy Email"
                                >
                                    {copiedField === `email-${index}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between group">
                                <span className="text-sm text-slate-600 font-mono">{cred.password}</span>
                                <button
                                    onClick={() => handleCopy(cred.password, `pass-${index}`)}
                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Copy Password"
                                >
                                    {copiedField === `pass-${index}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-xs text-slate-500 text-center">
                Click icon to copy to clipboard
            </div>
        </div>
    );
}
