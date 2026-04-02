import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your call center platform</p>
      </div>

      <Tabs defaultValue="twilio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="twilio">Twilio</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="business">Business Hours</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="twilio">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Twilio Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="password" />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input placeholder="Your Twilio auth token" type="password" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+1 (555) 000-0000" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Webhook Base URL</Label>
                <Input value="https://your-project.supabase.co/functions/v1" readOnly />
                <p className="text-xs text-muted-foreground">Configure these URLs in your Twilio console</p>
              </div>
              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio">
          <Card>
            <CardHeader><CardTitle className="text-base">Audio Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ringtone</Label>
                  <p className="text-xs text-muted-foreground">Play sound on incoming calls</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification Sounds</Label>
                  <p className="text-xs text-muted-foreground">Play sound for queue and system alerts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show desktop notifications for incoming calls</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-xs text-muted-foreground">Receive email for missed calls</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader><CardTitle className="text-base">Business Hours</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Business hours configuration coming soon. This will allow you to set operating hours per day of week.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader><CardTitle className="text-base">Account Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="your@email.com" type="email" />
              </div>
              <Button>Update Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
