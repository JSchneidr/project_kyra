import { CalendarController } from '@fullcalendar/react'
import { EventCalendarNextIcon, EventCalendarPrevIcon } from '@/components/event-calendar-icons'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type EventCalendarToolbarSize = 'sm' | 'md' | 'lg'

export interface EventCalendarToolbarProps {
  className?: string
  controller: CalendarController
  availableViews: string[]
  size?: EventCalendarToolbarSize
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

// Configuração de tamanhos para manter o alinhamento visual proporcional
const sizeConfig = {
  sm: {
    containerGap: 'gap-1.5',
    leftGap: 'gap-1.5',
    buttonSize: 'sm' as const,
    buttonClass: 'h-7 text-xs px-2',
    iconButton: 'h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5',
    title: 'text-xs font-semibold',
    tabsList: 'h-7 p-0.5',
    tabsTrigger: 'text-[11px] px-1.5 py-0.5 h-6',
  },
  md: {
    containerGap: 'gap-2',
    leftGap: 'gap-2',
    buttonSize: 'sm' as const,
    buttonClass: '',
    iconButton: 'h-8 w-8',
    title: 'text-sm font-semibold',
    tabsList: 'h-8 p-0.5',
    tabsTrigger: 'text-xs px-2 py-1 h-7',
  },
  lg: {
    containerGap: 'gap-3',
    leftGap: 'gap-3',
    buttonSize: 'default' as const,
    buttonClass: '',
    iconButton: 'h-9 w-9',
    title: 'text-base sm:text-lg font-semibold',
    tabsList: 'h-9 p-1',
    tabsTrigger: 'text-xs sm:text-sm px-3 py-1.5 h-7',
  },
}

export function EventCalendarToolbar({
  className,
  controller,
  availableViews,
  size = 'md',
  addButton,
}: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState()
  const currentSize = sizeConfig[size] ?? sizeConfig.md

  return (
    <div className={cn('flex items-center justify-between flex-wrap', currentSize.containerGap, className)}>
      <div className={cn('flex items-center shrink-0', currentSize.leftGap)}>
        {addButton && (
          <Button
            onClick={addButton.click as any}
            aria-label={addButton.hint}
            size={currentSize.buttonSize}
            variant={addButton.isPrimary ? 'default' : 'outline'}
          >
            {addButton.text}
          </Button>
        )}

        <Button
          onClick={() => controller.today()}
          aria-label={buttons.today.hint}
          variant="outline"
          size={currentSize.buttonSize}
        >
          {buttons.today.text}
        </Button>

        <div className="flex items-center">
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant="ghost"
            size="icon"
            className={currentSize.iconButton}
          >
            <EventCalendarPrevIcon />
          </Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant="ghost"
            size="icon"
            className={currentSize.iconButton}
          >
            <EventCalendarNextIcon />
          </Button>
        </div>

        <div className={currentSize.title}>{controller.view?.title}</div>
      </div>

      <Tabs value={controller.view?.type ?? availableViews[0]}>
        <TabsList className={currentSize.tabsList}>
          {availableViews.map((availableView) => (
            <TabsTrigger
              key={availableView}
              value={availableView}
              onClick={() => controller.changeView(availableView)}
              aria-label={buttons[availableView]?.hint}
              className={currentSize.tabsTrigger}
            >
              {buttons[availableView]?.text}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}