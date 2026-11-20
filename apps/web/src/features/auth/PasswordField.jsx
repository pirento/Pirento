// A password input with a show/hide button, on top of the house Field.
import {useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';
import {Field} from '../../components/ui/Field';

export function PasswordField(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute top-9 right-3 flex size-9 items-center justify-center rounded-full text-muted hover:text-ink"
      >
        {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
      </button>
    </div>
  );
}
