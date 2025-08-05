import { Header } from "@/components/page-header";
import { Button } from "@/components/ui/button";

import { pushSecret } from "@/api/secret"
import { encryptSecret } from "@/lib/crypto"

export function SecretEditorPage() {
    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];

    const save = () => {
        const content = encryptSecret("test", "abc123");
        pushSecret(content).then((id) => {
            alert(id)
        });
    }

    return (
        // TODO: header needs optional button(s) i can define
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                SECRET EDITOR IS TODO
                <Button onClick={save} />
            </div>
        </Header>
    );
}