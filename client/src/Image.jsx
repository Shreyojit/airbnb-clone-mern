export default function Image({src,...rest}) {
    src = src && src.includes('https://')
      ? src
      : 'https://airbnb-clone-mern-9myi.onrender.com/uploads/'+src;
    return (
      <img {...rest} src={src} alt={''} />
    );
  }
