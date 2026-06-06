const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src', 'features');
const files = [
  'expense/expense-dashboard.tsx',
  'performance/performance-dashboard.tsx',
  'surveys/survey-dashboard.tsx',
  'training/training-dashboard.tsx',
  'travel/travel-dashboard.tsx'
].map(f => path.join(featuresDir, f));

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log('Skipping missing file', f);
    return;
  }
  let c = fs.readFileSync(f, 'utf8');

  // Fix Card
  c = c.replace(/import \{.*CardTitle, CardContent.*\} from.*card.*/, 'import { Card } from "../../components/ui/card";');
  c = c.replace(/<CardTitle>/g, '<h3 className="text-lg font-semibold">').replace(/<\/CardTitle>/g, '</h3>');
  c = c.replace(/<CardContent>/g, '<div className="p-4">').replace(/<\/CardContent>/g, '</div>');

  // Fix Tabs
  c = c.replace(/import \{.*Tabs, TabsContent, TabsList, TabsTrigger.*\} from.*tabs.*/, '');
  c = c.replace(/<Tabs value=\{activeTab\}[^>]*>/g, '<div className="space-y-4">');
  c = c.replace(/<\/Tabs>/g, '</div>');
  c = c.replace(/<TabsList[^>]*>/g, '<div className="flex space-x-2 border-b pb-2">');
  c = c.replace(/<\/TabsList>/g, '</div>');
  c = c.replace(/<TabsTrigger value="([^"]+)"[^>]*>([^<]+)<\/TabsTrigger>/g, 
    '<button className={`px-4 py-2 font-medium ${activeTab === "$1" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("$1")}>$2</button>'
  );
  c = c.replace(/<TabsContent value="([^"]+)">([\s\S]*?)<\/TabsContent>/g, '{activeTab === "$1" && (<div>$2</div>)}');

  // Fix Dialog
  c = c.replace(/import \{.*Dialog.*\} from.*dialog.*/, '');
  // Using a regex with callbacks to wrap the button and the popup properly
  c = c.replace(/\{open && \(\<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"\>[\s\S]*?\<div onClick=\{.*\}>([\s\S]*?)<\/div>\s*(\<div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"\>[\s\S]*?)\<\/div\>\)\}/g, 
    (match, p1, p2) => {
      // p1 is the Button
      // p2 is the modal content
      return `<>
      <div onClick={() => setOpen(true)} className="inline-block">
        ${p1.trim()}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          ${p2.trim()}
        </div>
      )}
    </>`;
    }
  );

  // Fix Input
  c = c.replace(/import \{.*Input.*\} from.*input.*/, '');
  c = c.replace(/<Input /g, '<input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" ');

  // Fix Button variants
  c = c.replace(/variant="outline"/g, 'variant="secondary"');
  c = c.replace(/variant="destructive"/g, 'variant="danger"');

  // Fix event typing errors
  c = c.replace(/onChange=\{e =>/g, 'onChange={(e: any) =>');
  c = c.replace(/onChange=\{\(e\) =>/g, 'onChange={(e: any) =>');
  
  // Fix AsyncSelect parameter types
  c = c.replace(/getLabel=\{\(emp\) =>/g, 'getLabel={(emp: any) =>');
  c = c.replace(/getValue=\{\(emp\) =>/g, 'getValue={(emp: any) =>');

  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
