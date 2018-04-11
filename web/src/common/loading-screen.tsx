import * as React from 'react';

interface ILoadingScreenProps {
  message?: string;
  height?: string;
  className?: string;
  width?: string;
  style?: React.CSSProperties;
  imgHeight?: string;
}

export const LoadingScreen = (props: ILoadingScreenProps) => {
  let style: React.CSSProperties = { height: props.height || '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: props.width || '100%' };
  if (props.style) {
    style = {
      ...style,
      ...props.style
    };
  }

  return (
    <div className={props.className} style={style}>
      {!props.message && <img src='/images/oval.svg' style={{ height: props.imgHeight }} alt='Loading' />}
      {props.message}
    </div>
  );
};
