import type { TabKey, Me } from "@/entities/group";
import { Card } from "@/shared/ui/atoms/Card";
import { CardHeader } from "@/shared/ui/atoms/CardHeader";
import { Field } from "@/shared/ui/form/Field";
import { Input } from "@/shared/ui/form/Input";
import { PrimaryButton } from "@/shared/ui/buttons/PrimaryButton/PrimaryButton";
import { ButtonDangerOutline } from "@/shared/ui/buttons/ButtonDangerOutline";
import {
  PasswordSection,
  TokensSection,
  ProfileSection,
  IntegrationsSection,
  GroupsSection,
} from "@/features/account";

interface AccountTabContentProps {
  tab: TabKey;
  me: Me | null;
  setMe: (me: Me | null) => void;
}

export function AccountTabContent({ tab, me, setMe }: AccountTabContentProps) {
  return (
    <section className="space-y-4">
      {tab === "profile" && (
        <Card>
          <ProfileSection
            me={me}
            setMe={setMe}
            CardHeader={CardHeader}
            Field={Field}
            Input={Input}
            ButtonPrimary={PrimaryButton}
          />
        </Card>
      )}

      {tab === "groups" && (
        <Card>
          <GroupsSection
            CardHeader={CardHeader}
            Field={Field}
            Input={Input}
            ButtonPrimary={PrimaryButton}
            ButtonDangerOutline={ButtonDangerOutline}
          />
        </Card>
      )}

      {tab === "password" && (
        <Card>
          <PasswordSection
            email={me?.email}
            fullName={me?.fullName}
            Field={Field}
            Input={Input}
            ButtonPrimary={PrimaryButton}
            CardHeader={CardHeader}
          />
        </Card>
      )}

      {tab === "tokens" && (
        <Card>
          <TokensSection
            CardHeader={CardHeader}
            ButtonPrimary={PrimaryButton}
            ButtonDangerOutline={ButtonDangerOutline}
          />
        </Card>
      )}

      {tab === "integrations" && (
        <Card>
          <IntegrationsSection
            CardHeader={CardHeader}
            Field={Field}
            Input={Input}
            ButtonPrimary={PrimaryButton}
            ButtonDangerOutline={ButtonDangerOutline}
            me={me}
          />
        </Card>
      )}
    </section>
  );
}

