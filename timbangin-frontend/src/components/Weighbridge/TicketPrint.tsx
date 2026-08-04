import React, { useEffect } from 'react';

interface TicketPrintProps {
    transaction: any;
}

export const TicketPrint: React.FC<TicketPrintProps> = ({ transaction }) => {
    useEffect(() => {
        if (transaction) {
            const originalTitle = document.title;
            const dateStr = new Date(transaction.weighInTimestamp).toISOString().split('T')[0];
            const type = transaction.weighOutKg == null ? "Masuk" : "Keluar";
            const plate = transaction.truckPlateNumber.replace(/\s+/g, '');
            document.title = `Tiket_${type}_${plate}_${dateStr}`;
            
            return () => {
                document.title = originalTitle;
            };
        }
    }, [transaction]);

    if (!transaction) return null;

    return (
        <div className="hidden print:block font-mono text-sm p-8 bg-white text-black min-h-screen">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider">PT. Bangun Perkasa</h1>
                <p className="text-gray-600">Jl. Gatot Subroto No. 123, Jakarta</p>
                <h2 className="text-xl font-bold mt-2">TIKET TIMBANGAN</h2>
            </div>
            
            <div className="flex justify-between mb-8">
                <div>
                    <p><span className="font-semibold w-24 inline-block">No. Tiket</span>: {transaction.ticketNumber}</p>
                    <p><span className="font-semibold w-24 inline-block">Tanggal</span>: {new Date(transaction.weighInTimestamp).toLocaleDateString('id-ID')}</p>
                    <p><span className="font-semibold w-24 inline-block">Waktu Masuk</span>: {new Date(transaction.weighInTimestamp).toLocaleTimeString('id-ID')}</p>
                    {transaction.weighOutTimestamp && (
                        <p><span className="font-semibold w-24 inline-block">Waktu Keluar</span>: {new Date(transaction.weighOutTimestamp).toLocaleTimeString('id-ID')}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="font-semibold">Status: <span className="uppercase">{transaction.status}</span></p>
                    <p className="font-semibold">Tipe: <span className="uppercase">{transaction.transactionType}</span></p>
                </div>
            </div>

            <table className="w-full mb-8 border-collapse">
                <tbody>
                    <tr className="border-b border-black">
                        <td className="py-2 font-semibold w-1/3">No. Polisi (Plat)</td>
                        <td className="py-2">: {transaction.truckPlateNumber}</td>
                    </tr>
                    <tr className="border-b border-black">
                        <td className="py-2 font-semibold">Pelanggan</td>
                        <td className="py-2">: {transaction.customerName}</td>
                    </tr>
                    <tr className="border-b border-black">
                        <td className="py-2 font-semibold">Material</td>
                        <td className="py-2">: {transaction.materialTypeName}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
                <table className="w-1/2 border-collapse text-lg">
                    <tbody>
                        <tr>
                            <td className="py-1 font-semibold">Timbang Masuk</td>
                            <td className="py-1 text-right">{transaction.weighInKg?.toLocaleString('id-ID')} Kg</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-semibold border-b border-black">Timbang Keluar</td>
                            <td className="py-1 text-right border-b border-black">{transaction.weighOutKg ? `${transaction.weighOutKg.toLocaleString('id-ID')} Kg` : '- Kg'}</td>
                        </tr>
                        <tr className="font-bold text-xl">
                            <td className="py-2">NETTO</td>
                            <td className="py-2 text-right">{transaction.nettoKg ? `${transaction.nettoKg.toLocaleString('id-ID')} Kg` : '- Kg'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between mt-16 px-12">
                <div className="text-center">
                    <p className="mb-16">Sopir,</p>
                    <p className="font-semibold underline">(....................)</p>
                </div>
                <div className="text-center">
                    <p className="mb-16">Petugas Timbang,</p>
                    <p className="font-semibold underline">(....................)</p>
                </div>
            </div>
            
            <div className="text-center mt-8 text-xs text-gray-500">
                <p>Terima kasih. Simpan tanda terima ini sebagai bukti transaksi yang sah.</p>
                <p>Printed on: {new Date().toLocaleString('id-ID')}</p>
            </div>
        </div>
    );
};
