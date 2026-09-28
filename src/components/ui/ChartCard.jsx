import { Card, CardHeader, CardBody } from './Card';

export default function ChartCard({ title, subtitle, action, asOf, height = 260, children, className }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <CardBody>
        <div style={{ height }}>{children}</div>
        {asOf && <p className="mt-2 text-right text-[11px] text-slate-500">Source: CIC DWH · As of {asOf}</p>}
      </CardBody>
    </Card>
  );
}
