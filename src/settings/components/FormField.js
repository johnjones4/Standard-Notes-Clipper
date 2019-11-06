import 'preact'

export default (props) => {
  return (
    <div className='form-group'>
      <label for={props.name}>
        { props.label }
      </label>
      <input onChange={(event) => props.onChange(event)} required={props.required} name={props.name} id={props.name} type={props.type} placeholder={props.placeholder} className={'form-control'} value={props.value } />
    </div>
  )
}
