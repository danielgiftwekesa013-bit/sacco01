import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminCashAnalysis = () => {
  // Mock data for demonstration
  const transactions = [
    {
      id: 1,
      date: "2025-01-15",
      member: "John Doe",
      dailyDeposit: 200,
      loanRepayment: 500,
      welfare: 100,
      shares: 150,
      membership: 0,
      nhif: 50,
      shaa: 30,
      fines: 0,
    },
    {
      id: 2,
      date: "2025-01-16",
      member: "Jane Smith",
      dailyDeposit: 200,
      loanRepayment: 0,
      welfare: 100,
      shares: 150,
      membership: 500,
      nhif: 50,
      shaa: 30,
      fines: 10,
    },
    {
      id: 3,
      date: "2025-01-17",
      member: "Mike Johnson",
      dailyDeposit: 200,
      loanRepayment: 300,
      welfare: 100,
      shares: 150,
      membership: 0,
      nhif: 50,
      shaa: 30,
      fines: 0,
    },
    {
      id: 4,
      date: "2025-01-18",
      member: "Sarah Williams",
      dailyDeposit: 0,
      loanRepayment: 0,
      welfare: 100,
      shares: 150,
      membership: 0,
      nhif: 50,
      shaa: 30,
      fines: 10,
    },
  ];

  const calculateTotals = () => {
    return transactions.reduce(
      (acc, t) => ({
        dailyDeposit: acc.dailyDeposit + t.dailyDeposit,
        loanRepayment: acc.loanRepayment + t.loanRepayment,
        welfare: acc.welfare + t.welfare,
        shares: acc.shares + t.shares,
        membership: acc.membership + t.membership,
        nhif: acc.nhif + t.nhif,
        shaa: acc.shaa + t.shaa,
        fines: acc.fines + t.fines,
      }),
      {
        dailyDeposit: 0,
        loanRepayment: 0,
        welfare: 0,
        shares: 0,
        membership: 0,
        nhif: 0,
        shaa: 0,
        fines: 0,
      }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cash Analysis</h2>
        <p className="text-muted-foreground">
          Complete overview of all deposits and deductions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Member</TableHead>
                  <TableHead className="text-right font-bold">Daily Deposit</TableHead>
                  <TableHead className="text-right font-bold">Loan Repayment</TableHead>
                  <TableHead className="text-right font-bold">Welfare</TableHead>
                  <TableHead className="text-right font-bold">Shares</TableHead>
                  <TableHead className="text-right font-bold">Membership</TableHead>
                  <TableHead className="text-right font-bold">NHIF</TableHead>
                  <TableHead className="text-right font-bold">SHAA</TableHead>
                  <TableHead className="text-right font-bold">Fines</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.member}</TableCell>
                    <TableCell className="text-right">
                      {transaction.dailyDeposit > 0 ? `Ksh ${transaction.dailyDeposit}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.loanRepayment > 0 ? `Ksh ${transaction.loanRepayment}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.welfare > 0 ? `Ksh ${transaction.welfare}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.shares > 0 ? `Ksh ${transaction.shares}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.membership > 0 ? `Ksh ${transaction.membership}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.nhif > 0 ? `Ksh ${transaction.nhif}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.shaa > 0 ? `Ksh ${transaction.shaa}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.fines > 0 ? `Ksh ${transaction.fines}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={2}>TOTALS</TableCell>
                  <TableCell className="text-right">Ksh {totals.dailyDeposit}</TableCell>
                  <TableCell className="text-right">Ksh {totals.loanRepayment}</TableCell>
                  <TableCell className="text-right">Ksh {totals.welfare}</TableCell>
                  <TableCell className="text-right">Ksh {totals.shares}</TableCell>
                  <TableCell className="text-right">Ksh {totals.membership}</TableCell>
                  <TableCell className="text-right">Ksh {totals.nhif}</TableCell>
                  <TableCell className="text-right">Ksh {totals.shaa}</TableCell>
                  <TableCell className="text-right">Ksh {totals.fines}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCashAnalysis;