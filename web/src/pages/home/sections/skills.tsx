import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Skills() {
    const languages = [
        { name: "Go", thought: "Daily usage" },
        { name: "C", thought: "Favorite language" },
        { name: "C++", thought: "Pain" },
        { name: "Intel x86/x86_64 ASM", thought: "Suffering" },
        { name: "Java", thought: "First language" },
        { name: "C#", thought: "Second language" },
        { name: "JavaScript", thought: "Everyone learns this" },
        { name: "Python", thought: "For AI" },
        { name: "SQL", thought: "Everyone needs DBs" },
        { name: "Solidity", thought: "Smart Contracts on EVM" },
        { name: "Bash", thought: "Scripting" },
        { name: "PowerShell", thought: "Windows Scripting" },
    ];

    return (<section className="px-6 mx-6">
        <h2 className="text-2xl font-bold mb-4">Programming Languages</h2>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Thoughts</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {languages.map((lang, index) => (
                    <TableRow key={index}>
                        <TableCell>{lang.name}</TableCell>
                        <TableCell className="text-accent-foreground">{lang.thought}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        <p className="mt-4 text-muted-foreground">Also familiar with React/TypeScript, but not an expert.</p>
    </section>
    )
}