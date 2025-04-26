import SettingsClient from "./SettingsClient";

export default async function SettingsPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <SettingsClient uuid={uuid} />;
}
