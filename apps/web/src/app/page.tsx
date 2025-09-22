// UI components will be imported from @aibos/ui package
// import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@aibos/ui";

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold">AI-BOS ERP</h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your business operations with our intelligent,
            cloud-native Enterprise Resource Planning system designed for modern
            enterprises.
          </p>

          <div className="text-sm text-gray-500">
            UI components will be imported from @aibos/ui package
          </div>
        </div>
      </div>
    </div>
  );
}
