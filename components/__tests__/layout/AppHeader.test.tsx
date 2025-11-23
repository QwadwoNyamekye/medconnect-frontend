import { render, screen } from '@testing-library/react';
import { AppHeader } from '../../layout/AppHeader';

describe('AppHeader', () => {
  it('should render with default title', () => {
    render(<AppHeader />);
    expect(screen.getByText('MedConnect')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<AppHeader title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render back button when showBack is true', () => {
    const onBack = jest.fn();
    render(<AppHeader showBack onBack={onBack} />);
    
    const backButton = screen.getByLabelText('Back');
    expect(backButton).toBeInTheDocument();
  });

  it('should not render back button when showBack is false', () => {
    render(<AppHeader showBack={false} />);
    
    const backButton = screen.queryByLabelText('Back');
    expect(backButton).not.toBeInTheDocument();
  });

  it('should render right content when provided', () => {
    const rightContent = <button>Action</button>;
    render(<AppHeader rightContent={rightContent} />);
    
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    const onBack = jest.fn();
    render(<AppHeader showBack onBack={onBack} />);
    
    const backButton = screen.getByLabelText('Back');
    backButton.click();
    
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

