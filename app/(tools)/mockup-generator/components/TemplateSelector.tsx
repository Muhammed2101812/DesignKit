'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { Smartphone, FileText, Shirt } from 'lucide-react'
import type { MockupTemplate } from '../page'

interface TemplateSelectorProps {
  onSelectTemplate: (template: MockupTemplate) => void
}

// Sample mockup templates
const MOCKUP_TEMPLATES: MockupTemplate[] = [
  // Device mockups
  {
    id: 'iphone-14',
    name: 'iPhone 14 Pro',
    category: 'device',
    templateImage: '/mockup-templates/iphone-14-pro.svg',
    designArea: { x: 50, y: 100, width: 300, height: 650 },
  },
  {
    id: 'macbook-pro',
    name: 'MacBook Pro',
    category: 'device',
    templateImage: '/mockup-templates/macbook-pro.svg',
    designArea: { x: 100, y: 80, width: 600, height: 400 },
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    category: 'device',
    templateImage: '/mockup-templates/ipad-air.svg',
    designArea: { x: 80, y: 120, width: 400, height: 550 },
  },
  
  // Print mockups
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'print',
    templateImage: '/mockup-templates/business-card.svg',
    designArea: { x: 50, y: 50, width: 350, height: 200 },
    perspective: {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 350, y: 10 },
      bottomRight: { x: 340, y: 200 },
      bottomLeft: { x: 10, y: 190 },
    },
  },
  {
    id: 'poster-a4',
    name: 'A4 Poster',
    category: 'print',
    templateImage: '/mockup-templates/poster-a4.svg',
    designArea: { x: 100, y: 150, width: 300, height: 420 },
  },
  {
    id: 'flyer',
    name: 'Flyer',
    category: 'print',
    templateImage: '/mockup-templates/flyer.svg',
    designArea: { x: 80, y: 100, width: 320, height: 450 },
  },
  
  // Apparel mockups
  {
    id: 't-shirt-front',
    name: 'T-Shirt (Front)',
    category: 'apparel',
    templateImage: '/mockup-templates/t-shirt-front.svg',
    designArea: { x: 150, y: 200, width: 250, height: 250 },
  },
  {
    id: 'hoodie-front',
    name: 'Hoodie (Front)',
    category: 'apparel',
    templateImage: '/mockup-templates/hoodie-front.svg',
    designArea: { x: 140, y: 220, width: 270, height: 270 },
  },
  {
    id: 'tote-bag',
    name: 'Tote Bag',
    category: 'apparel',
    templateImage: '/mockup-templates/tote-bag.svg',
    designArea: { x: 120, y: 180, width: 300, height: 300 },
  },
]

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<'device' | 'print' | 'apparel'>('device')

  const deviceTemplates = MOCKUP_TEMPLATES.filter(t => t.category === 'device')
  const printTemplates = MOCKUP_TEMPLATES.filter(t => t.category === 'print')
  const apparelTemplates = MOCKUP_TEMPLATES.filter(t => t.category === 'apparel')

  return (
    <div className="space-y-4">
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as 'device' | 'print' | 'apparel')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="device" className="gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </TabsTrigger>
          <TabsTrigger value="apparel" className="gap-2">
            <Shirt className="h-4 w-4" />
            <span className="hidden sm:inline">Apparel</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="device" className="mt-4">
          <TemplateGrid templates={deviceTemplates} onSelect={onSelectTemplate} />
        </TabsContent>

        <TabsContent value="print" className="mt-4">
          <TemplateGrid templates={printTemplates} onSelect={onSelectTemplate} />
        </TabsContent>

        <TabsContent value="apparel" className="mt-4">
          <TemplateGrid templates={apparelTemplates} onSelect={onSelectTemplate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TemplateGridProps {
  templates: MockupTemplate[]
  onSelect: (template: MockupTemplate) => void
}

function TemplateGrid({ templates, onSelect }: TemplateGridProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const handleSelect = (template: MockupTemplate) => {
    setSelectedId(template.id)
    onSelect(template)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            selectedId === template.id && 'ring-2 ring-primary'
          )}
          onClick={() => handleSelect(template)}
        >
          <CardContent className="p-4">
            <div className="aspect-square rounded-lg bg-muted/50 mb-3 overflow-hidden flex items-center justify-center">
              <img
                src={template.templateImage}
                alt={`${template.name} template preview`}
                className="w-full h-full object-contain p-2"
              />
            </div>
            <h4 className="font-medium text-sm text-center">{template.name}</h4>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
