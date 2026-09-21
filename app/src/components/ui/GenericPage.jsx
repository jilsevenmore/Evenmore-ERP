/**
 * GenericPage — CRM-styled placeholder for HRMS and administration pages
 * that haven't been fully migrated yet.
 */
import PageHeader from '../../components/ui/PageHeader';
import { useTranslation } from '../../i18n';

export default function GenericPage({ title, subtitle, breadcrumb }) {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb}
      />
      <div className="section-wrap">
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
            <span style={{ fontSize: '2.5rem' }}>🚧</span>
            <h3 style={{ margin: 0, color: '#294364', fontWeight: 700 }}>{title}</h3>
            <p style={{ margin: 0, color: '#7184a3', fontSize: '0.9rem', textAlign: 'center' }}>
              {subtitle || t('common.genericPageDesc')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
